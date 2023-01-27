<script lang="ts">
	import { mdiPencilOutline, mdiDotsHorizontal } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import Dialog, { Actions, Content, Title, InitialFocus } from "@smui/dialog";
	import SliceDetails from "../../general/SliceDetails.svelte";
	import {
		status,
		showNewSlice,
		selections,
		slices,
		sliceToEdit,
		reports,
		model,
		metric,
	} from "../../stores";
	import {
		getMetricsForSlices,
		deleteSlice,
		createNewSlice,
	} from "../../api/slice";

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
			return { slices: [], metadata: { ...m.metadata } };
		});
		slices.update((s) => {
			s.delete(slice.sliceName);
			return s;
		});
		reports.update((reps) => {
			reps = reps.map((r) => {
				r.reportPredicates = r.reportPredicates.filter(
					(p) => p.sliceName !== slice.sliceName
				);
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
			selections.update((s) => ({ slices: [], metadata: s.metadata }));
			return;
		}
		if (e.shiftKey) {
			if ($selections.slices.includes(slice.sliceName)) {
				selections.update((sel) => {
					sel.slices.splice(sel.slices.indexOf(slice.sliceName), 1);
					return {
						slices: [...sel.slices],
						metadata: sel.metadata,
					};
				});
			} else {
				selections.update((sel) => ({
					slices: [...sel.slices, slice.sliceName],
					metadata: sel.metadata,
				}));
			}
		} else {
			if ($selections.slices.includes(slice.sliceName)) {
				if ($selections.slices.length > 0) {
					selections.update((sel) => ({
						slices: [slice.sliceName],
						metadata: sel.metadata,
					}));
				} else {
					selections.update((sel) => {
						sel.slices.splice(sel.slices.indexOf(slice.sliceName), 1);
						return {
							slices: [...sel.slices],
							metadata: sel.metadata,
						};
					});
				}
			} else {
				selections.update((sel) => ({
					slices: [slice.sliceName],
					metadata: sel.metadata,
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
		if (ev.dataTransfer.dropEffect === "none") {
			slices.update((sls) => {
				const sli = sls.get(slice.sliceName);
				sli.folder = "";
				sls.set(slice.sliceName, sli);
				createNewSlice(sli.sliceName, sli.filterPredicates);
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
					style:color="#6a1b9a"
					on:mouseover={() => (showTooltip = true)}
					on:mouseout={() => (showTooltip = false)}
					on:focus={() => (showTooltip = true)}
					on:blur={() => (showTooltip = false)}>
					{slice.sliceName}
				</div>
			</div>
			<div class="group">
				{#if showOptions}
					<div
						id="options-container"
						on:mouseleave={() => (showOptions = false)}
						on:blur={() => (showOptions = false)}>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								$reports.forEach((r) => {
									let hasSlice = false;
									r.reportPredicates.forEach((p) => {
										if (p.sliceName === slice.sliceName) {
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
							<Icon class="material-icons">delete_outline</Icon>
						</IconButton>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								sliceToEdit.set(slice);
								showNewSlice.set(true);
							}}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiPencilOutline} />
							</Icon>
						</IconButton>
					</div>
				{/if}
				{#if result}
					{#await result then res}
						<span style:margin-right="10px">
							{res[0].metric ? res[0].metric.toFixed(2) : ""}
						</span>
						<span id="size">
							({res[0].size})
						</span>
					{/await}
				{/if}
				<div class="inline" style:cursor="pointer">
					<div style:width="36px">
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
		background: white;
		position: absolute;
		top: 100%;
		max-width: 1000px;
		width: fit-content;
		background: white;
		z-index: 10;
		left: 0px;
	}
	.tooltip {
		background: white;
		padding-left: 5px;
		padding-right: 5px;
		box-shadow: 1px 1px 3px 1px #ccc;
		border-radius: 3px;
	}
	#size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
	.cell {
		position: relative;
		overflow: visible;
		border: 0.5px solid #d1d1d1;
		border-radius: 5px;
		margin-top: 5px;
		display: flex;
		padding-left: 10px;
		padding-right: 10px;
		height: 36px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
	.selected {
		background: #f9f5ff;
	}
	.inline {
		display: flex;
		flex-direction: row;
	}
	.in-folder {
		padding-left: 44px;
		margin-top: 0px;
		margin-bottom: 0px;
	}
	#options-container {
		top: 0px;
		right: 0px;
		z-index: 5;
		background: white;
		margin-top: -7px;
		border: 1px solid #e8e8e8;
		position: absolute;
		height: max-content;
		display: flex;
	}
</style>
