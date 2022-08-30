<script lang="ts">
	import { mdiPencilOutline, mdiDotsHorizontal } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common/elements";
	import Dialog, { Actions, Content, Title, InitialFocus } from "@smui/dialog";
	import SliceDetails from "../../general/SliceDetails.svelte";
	import {
		metric,
		model,
		showNewSlice,
		slices,
		sliceSelections,
		sliceToEdit,
		transform,
		reports,
	} from "../../stores";
	import { getMetricsForSlices } from "../../util/util";

	export let slice: Slice;
	export let inFolder = false;

	let confirmDelete = false;
	let relatedReports = 0;

	let showTooltip = false;
	let hovering = false;
	let showOptions = false;
	$: selected = $sliceSelections.includes(slice.sliceName);

	function deleteSlice() {
		confirmDelete = false;
		relatedReports = 0;

		sliceSelections.update((s) => {
			s.splice(s.indexOf(slice.sliceName), 1);
			return s;
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
	}

	function setSelected(e) {
		// Imitate selections in Vega bar charts.
		if (
			$sliceSelections.length === 1 &&
			$sliceSelections.includes(slice.sliceName)
		) {
			sliceSelections.set([]);
			return;
		}
		if (e.shiftKey) {
			if ($sliceSelections.includes(slice.sliceName)) {
				sliceSelections.update((sel) => {
					sel.splice(sel.indexOf(slice.sliceName), 1);
					return [...sel];
				});
			} else {
				sliceSelections.update((slis) => [...slis, slice.sliceName]);
			}
		} else {
			if ($sliceSelections.includes(slice.sliceName)) {
				if ($sliceSelections.length > 0) {
					sliceSelections.set([slice.sliceName]);
				} else {
					sliceSelections.update((sel) => {
						sel.splice(sel.indexOf(slice.sliceName), 1);
						return [...sel];
					});
				}
			} else {
				sliceSelections.set([slice.sliceName]);
			}
		}
	}

	$: result = getMetricsForSlices([
		<MetricKey>{
			sli: slice,
			metric: $metric,
			model: $model,
			transform: $transform,
		},
	]);
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
	on:dragend={(ev) => {
		if (ev.dataTransfer.dropEffect === "none") {
			slices.update((sls) => {
				const sli = sls.get(slice.sliceName);
				sli.folder = "";
				sls.set(slice.sliceName, sli);
				return sls;
			});
		}
	}}>
	<div class="group" style:width="100%">
		<div class="group" style:width="100%">
			<div class="inline">
				<div
					class="group"
					style:color="#6a1b9a"
					style:width="max-content"
					on:mouseover={() => (showTooltip = true)}
					on:mouseout={() => (showTooltip = false)}
					on:focus={() => (showTooltip = true)}
					on:blur={() => (showTooltip = false)}>
					{slice.sliceName}
				</div>
			</div>
			<div class="group">
				{#if result}
					<span style:margin-right="10px">
						{#await result then res}
							{res && res[0] !== undefined ? res[0].toFixed(2) : ""}
						{/await}
					</span>
					<span id="size">
						({slice.idxs.length})
					</span>
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

					{#if showOptions}
						<div
							id="options-container"
							on:mouseleave={() => (showOptions = false)}
							on:blur={() => (showOptions = false)}>
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
										deleteSlice();
									}
								}}>
								<Icon class="material-icons">delete_outline</Icon>
							</IconButton>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	{#if showTooltip}
		<div class="tooltip-container">
			<div class="tooltip">
				<SliceDetails predicateGroup={slice.filterPredicates} />
			</div>
		</div>
	{/if}
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
		<Button use={[InitialFocus]} on:click={() => deleteSlice()}>
			<Label>Yes</Label>
		</Button>
	</Actions>
</Dialog>

<style>
	.tooltip-container {
		z-index: 5;
		background: white;
		margin-top: 36px;
		position: absolute;
		height: max-content;
	}
	.tooltip {
		background: white;
		padding: 10px;
		box-shadow: 1px 1px 3px 1px #ccc;
		border-radius: 3px;
	}
	#size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
	.cell {
		overflow: visible;
		border: 1px solid #e0e0e0;
		border-radius: 5px;
		margin-top: 5px;
		margin-bottom: 5px;
		display: flex;
		padding-top: 5px;
		padding-bottom: 5px;
		padding-left: 10px;
		padding-right: 10px;
		height: 36px;
		margin-right: 10px;
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
		margin-left: 25px;
		margin-top: 0px;
		margin-bottom: 0px;
	}
	#options-container {
		z-index: 5;
		background: white;
		margin-top: -7px;
		border: 1px solid #e8e8e8;
		position: absolute;
		height: max-content;
		display: flex;
	}
</style>
