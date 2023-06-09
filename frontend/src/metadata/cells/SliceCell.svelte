<script lang="ts">
	import { mdiDotsHorizontal } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import { Svg } from "@smui/common";
	import Dialog, { Actions, Content, InitialFocus, Title } from "@smui/dialog";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import { deleteSlice, getMetricsForSlices } from "../../api/slice";
	import SliceDetails from "../../general/SliceDetails.svelte";
	import {
		metric,
		model,
		reports,
		selections,
		showNewSlice,
		sliceToEdit,
		slices,
		status,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { ZenoService, type MetricKey, type Slice } from "../../zenoservice";

	export let slice: Slice;
	export let inFolder = false;

	let result;

	let confirmDelete = false;
	let relatedReports = 0;

	let showTooltip = false;
	let hovering = false;
	let showOptions = false;

	$: selected = $selections.slices.includes(slice.sliceName);
	$: {
		$status;
		result = getMetricsForSlices([
			<MetricKey>{
				sli: slice,
				model: $model,
				metric: $metric,
			},
		]);
	}

	function removeSlice() {
		confirmDelete = false;
		relatedReports = 0;

		selections.update((m) => {
			for (let key in m.metadata) {
				m.metadata[key] = { predicates: [], join: "&" };
			}
			return { slices: [], metadata: { ...m.metadata }, tags: [] };
		});
		reports.update((reps) => {
			reps = reps.map((r) => {
				r.slices = r.slices.filter((p) => p !== slice.sliceName);
				return r;
			});
			return reps;
		});
		deleteSlice(slice.sliceName);
	}

	function setSelected(e) {
		// Imitate selections in Vega bar charts.
		if (
			$selections.slices.length === 1 &&
			$selections.slices.includes(slice.sliceName)
		) {
			selections.update((s) => ({
				slices: [],
				metadata: s.metadata,
				tags: s.tags,
			}));
			return;
		}
		if (e.shiftKey) {
			if ($selections.slices.includes(slice.sliceName)) {
				selections.update((sel) => {
					sel.slices.splice(sel.slices.indexOf(slice.sliceName), 1);
					return {
						slices: [...sel.slices],
						metadata: sel.metadata,
						tags: sel.tags,
					};
				});
			} else {
				selections.update((sel) => ({
					slices: [...sel.slices, slice.sliceName],
					metadata: sel.metadata,
					tags: sel.tags,
				}));
			}
		} else {
			if ($selections.slices.includes(slice.sliceName)) {
				if ($selections.slices.length > 0) {
					selections.update((sel) => ({
						slices: [slice.sliceName],
						metadata: sel.metadata,
						tags: sel.tags,
					}));
				} else {
					selections.update((sel) => {
						sel.slices.splice(sel.slices.indexOf(slice.sliceName), 1);
						return {
							slices: [...sel.slices],
							metadata: sel.metadata,
							tags: sel.tags,
						};
					});
				}
			} else {
				selections.update((sel) => ({
					slices: [slice.sliceName],
					metadata: sel.metadata,
					tags: sel.tags,
				}));
			}
		}
	}
</script>

<div
	class="{inFolder ? 'in-folder' : ''} cell parent {selected ? 'selected' : ''}"
	on:click={(e) => setSelected(e)}
	draggable="true"
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}
	on:dragstart={(ev) => {
		ev.dataTransfer.setData("text/plain", slice.sliceName);
		ev.dataTransfer.dropEffect = "copy";
	}}
	on:keydown={() => ({})}
	on:dragend={(ev) => {
		// If dragged out of a folder, remove from the folder it was in.
		if (ev.dataTransfer.dropEffect === "none") {
			slices.update((sls) => {
				const sli = sls.get(slice.sliceName);
				sli.folder = "";
				sls.set(slice.sliceName, sli);
				ZenoService.createNewSlice({
					sliceName: sli.sliceName,
					filterPredicates: sli.filterPredicates,
					folder: sli.folder,
				});
				return sls;
			});
		}
	}}>
	{#if showTooltip}
		<div class="tooltip-container">
			<div class="tooltip">
				<SliceDetails predicateGroup={slice.filterPredicates} />
			</div>
		</div>
	{/if}

	<div class="group" style:width="100%">
		<div class="group" style:width="100%">
			<div class="inline">
				<div
					class="group"
					style:color="var(--G1)"
					on:mouseover={() => (showTooltip = true)}
					on:mouseout={() => (showTooltip = false)}
					on:focus={() => (showTooltip = true)}
					on:blur={() => (showTooltip = false)}>
					{slice.sliceName}
				</div>
			</div>
			<div
				class="group"
				use:clickOutside
				on:click_outside={() => {
					showOptions = false;
				}}>
				{#if showOptions}
					<div id="options-container">
						<Paper style="padding: 3px 0px;" elevation={7}>
							<Content>
								<div
									class="option"
									on:keydown={() => ({})}
									on:click={(e) => {
										e.stopPropagation();
										showOptions = false;
										sliceToEdit.set(slice);
										showNewSlice.set(true);
									}}>
									<Icon style="font-size: 18px;" class="material-icons"
										>edit</Icon
									>&nbsp;
									<span>Edit</span>
								</div>
								<div
									class="option"
									on:keydown={() => ({})}
									on:click={(e) => {
										e.stopPropagation();
										showOptions = false;
										$reports.forEach((r) => {
											let hasSlice = false;
											r.slices.forEach((p) => {
												if (p === slice.sliceName) {
													hasSlice = true;
												}
											});
											if (hasSlice) {
												relatedReports++;
											}
										});
										if (relatedReports > 0) {
											confirmDelete = true;
										} else {
											removeSlice();
										}
									}}>
									<Icon style="font-size: 18px;" class="material-icons"
										>delete_outline</Icon
									>&nbsp;
									<span>Remove</span>
								</div>
							</Content>
						</Paper>
					</div>
				{/if}
				{#if result}
					{#await result then res}
						<span style:margin-right="10px">
							{res[0].metric !== undefined && res[0].metric !== null
								? res[0].metric.toFixed(2)
								: ""}
						</span>
						<span id="size">
							({res[0].size.toLocaleString()})
						</span>
					{/await}
				{/if}
				<div class="inline" style:cursor="pointer">
					<div
						style:width="36px"
						use:clickOutside
						on:click_outside={() => {
							hovering = false;
						}}>
						{#if hovering}
							<IconButton
								size="button"
								style="padding: 0px"
								on:click={(e) => {
									e.stopPropagation();
									showOptions = !showOptions;
								}}>
								<Icon component={Svg} viewBox="0 0 24 24">
									<path fill="black" d={mdiDotsHorizontal} />
								</Icon>
							</IconButton>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<Dialog
	bind:open={confirmDelete}
	scrimClickAction=""
	escapeKeyAction=""
	aria-labelledby="delete-slice"
	aria-describedby="delete-slice">
	<Title id="simple-title">Delete Slice</Title>
	<Content id="simple-content"
		>This slice will be removed from {relatedReports} report{relatedReports > 1
			? "s"
			: ""}. Continue?</Content>
	<Actions>
		<Button on:click={() => (confirmDelete = false)}>
			<Label>No</Label>
		</Button>
		<Button use={[InitialFocus]} on:click={() => removeSlice()}>
			<Label>Yes</Label>
		</Button>
	</Actions>
</Dialog>

<style>
	.tooltip-container {
		background: var(--G6);
		position: absolute;
		top: 100%;
		max-width: 1000px;
		width: fit-content;
		background: var(--G6);
		z-index: 10;
		left: 0px;
	}
	.tooltip {
		background: var(--G6);
		padding-left: 10px;
		padding-right: 10px;
		box-shadow: 1px 1px 3px 1px var(--G3);
		border-radius: 4px;
		padding-top: 10px;
		padding-bottom: 10px;
	}
	#size {
		font-style: italic;
		color: var(--G3);
		margin-right: 10px;
	}
	.cell {
		position: relative;
		overflow: visible;
		border: 0.5px solid var(--G4);
		border-radius: 4px;
		margin-top: 5px;
		display: flex;
		padding-left: 10px;
		padding-right: 10px;
		min-height: 36px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
	.selected {
		background: var(--P3);
	}
	.inline {
		display: flex;
		flex-direction: row;
	}
	.in-folder {
		margin-left: 35px;
		margin-top: 0px;
		margin-bottom: 0px;
	}
	#options-container {
		top: 0px;
		right: 0px;
		z-index: 5;
		position: absolute;
		margin-top: 35px;
	}
	.option {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
		width: 73px;
		padding: 1px 6px;
	}
	.option span {
		font-size: 12px;
	}
	.option:hover {
		background: var(--G5);
	}
</style>
