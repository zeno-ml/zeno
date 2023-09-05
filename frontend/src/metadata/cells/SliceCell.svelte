<script lang="ts">
	import { mdiDotsHorizontal } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import { Svg } from "@smui/common";
	import Dialog, { Actions, Content, InitialFocus, Title } from "@smui/dialog";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import { deleteSlice, doesModelDependOnPredicates } from "../../api/slice";
	import { selectSliceCell } from "./sliceCellUtil";
	import SliceDetails from "../../general/SliceDetails.svelte";
	import SliceCellResult from "./SliceCellResult.svelte";
	import {
		reports,
		selections,
		showNewSlice,
		sliceToEdit,
		slices,
		model,
		comparisonModel,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { ZenoService, type Slice } from "../../zenoservice";

	export let slice: Slice;
	export let inFolder = false;
	export let compare;

	let confirmDelete = false;
	let relatedReports = 0;

	let showTooltip = false;
	let hovering = false;
	let showOptions = false;

	let compareButton = slice
		? doesModelDependOnPredicates(slice.filterPredicates.predicates)
		: false;

	$: selected = $selections.slices.includes(slice.sliceName);
	$: transferData =
		$selections.slices.length > 0 &&
		$selections.slices.includes(slice.sliceName)
			? getSlicesIndex($selections.slices)
			: getSlicesIndex([slice.sliceName]);

	/** Return slices index stored in $slices **/
	function getSlicesIndex(sls) {
		let idxs = [];
		Array.from($slices.entries()).forEach((s, i) => {
			if (sls.includes(s[0])) {
				idxs.push(i);
			}
		});
		return idxs.join(",");
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
		if (compare && compareButton) {
			return;
		}
		selectSliceCell(e, slice.sliceName);
	}
</script>

<div
	class=" cell parent
	{inFolder ? 'in-folder' : ''}
	{selected ? 'selected' : ''} 
	{compare ? 'compare-slice-cell' : ''}
	{compare && compareButton ? '' : 'pointer'}"
	on:click={(e) => setSelected(e)}
	draggable="true"
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}
	on:dragstart={(ev) => {
		ev.dataTransfer.setData("text/plain", transferData);
		ev.dataTransfer.dropEffect = "copy";
	}}
	on:keydown={() => ({})}
	on:dragend={(ev) => {
		// If dragged out of a folder, remove from the folder it was in.
		if (ev.dataTransfer.dropEffect === "none") {
			const data = transferData.split(",");
			slices.update((sls) => {
				let entries = Array.from($slices.entries());
				data.forEach((d) => {
					const sli = sls.get(entries[d][0]);
					sli.folder = "";
					sls.set(entries[d][0], sli);
					ZenoService.createNewSlice({
						sliceName: sli.sliceName,
						filterPredicates: sli.filterPredicates,
						folder: sli.folder,
					});
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
								<Icon style="font-size: 18px;" class="material-icons">edit</Icon
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
			<SliceCellResult {compare} {slice} sliceModel={$model} />
			{#if compare}
				<SliceCellResult {compare} {slice} sliceModel={$comparisonModel} />
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
		<Button
			on:click={() => {
				confirmDelete = false;
				relatedReports = 0;
			}}>
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
	.compare-slice-cell {
		padding-top: 5px;
		padding-bottom: 5px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.pointer {
		cursor: pointer;
	}
	.selected {
		background: var(--P3);
	}
	.inline {
		display: flex;
		flex-direction: row;
		margin-right: 5px;
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
