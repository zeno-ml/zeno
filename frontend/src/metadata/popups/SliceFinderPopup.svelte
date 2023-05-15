<script lang="ts">
	import { mdiClose, mdiInformationOutline } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import Select, { Option } from "@smui/select";
	import { tooltip } from "@svelte-plugins/tooltips";
	import Svelecte from "svelecte";
	import { fade } from "svelte/transition";
	import {
		model,
		showNewSlice,
		showSliceFinder,
		sliceToEdit,
		slices,
		status,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import {
		MetadataType,
		ZenoColumnType,
		ZenoService,
		type SliceFinderReturn,
	} from "../../zenoservice";

	// Columns to create candidate slices accross
	// TODO: Support discretized continuous columns.
	let searchColumnOptions = $status.completeColumns.filter(
		(d) =>
			(d.metadataType === MetadataType.NOMINAL ||
				d.metadataType === MetadataType.BOOLEAN) &&
			(d.columnType === ZenoColumnType.METADATA ||
				d.columnType === ZenoColumnType.PREDISTILL ||
				((d.columnType === ZenoColumnType.OUTPUT ||
					d.columnType === ZenoColumnType.POSTDISTILL) &&
					d.model === $model))
	);
	let searchColumns =
		searchColumnOptions.length > 0 ? searchColumnOptions : undefined;

	// Column to use as the metric to compare slices.
	let metricColumns = $status.completeColumns.filter(
		(d) =>
			(d.metadataType === MetadataType.CONTINUOUS ||
				d.metadataType === MetadataType.BOOLEAN) &&
			(d.columnType === ZenoColumnType.METADATA ||
				d.columnType === ZenoColumnType.PREDISTILL ||
				((d.columnType === ZenoColumnType.OUTPUT ||
					d.columnType === ZenoColumnType.POSTDISTILL) &&
					d.model === $model))
	);
	let metricColumn = metricColumns.length > 0 ? metricColumns[0] : undefined;

	// TODO: make options for `alpha`, `min_supp`. Maybe use Svelecte.
	let minimumSizes = ["1", "2", "3", "4", "5", "6", "7"];
	let minimumSize = "1";
	let maxLs = ["4", "5", "6", "7", "8"];
	let maxL = "5";
	let orderByOptions = ["ascending", "descending"];
	let orderBy = "ascending";
	let sliceFinderReturn: SliceFinderReturn;

	$: sliceFinderMessage = "";

	export async function addSliceAtIndex(idx) {
		let slice = sliceFinderReturn.slices[idx];

		ZenoService.createNewSlice(slice).then(() => {
			slices.update((s) => {
				s.set(slice.sliceName, slice);
				return s;
			});
			showNewSlice.set(false);
			sliceToEdit.set(null);
		});
	}

	export async function activateSliceFinder() {
		sliceFinderMessage = "Generating Slices...";
		sliceFinderReturn = await ZenoService.runSliceFinder({
			columns: searchColumns,
			metricColumn: metricColumn,
			orderBy: orderBy,
			minimumSize: parseInt(minimumSize),
			depth: parseInt(maxL),
		});

		// TODO: render slices using return

		sliceFinderMessage = "";
	}

	function submit(e) {
		if ($showSliceFinder && e.key === "Escape") {
			$showSliceFinder = false;
		}
	}

	// function slice_data_generator(
	// 	predicateList = [],
	// 	slices_of_interest = [],
	// 	all_metrics = []
	// ) {
	// 	// demo page
	// 	get_all_valid_columns();
	// 	slice_data = [];
	// 	if (predicateList.length === 0) {
	// 		predicateList = [
	// 			"Welcome to the Slice Finder Screen! Click on the Button on the upperright corner to begin!",
	// 		];
	// 		let predicate = [];
	// 		predicate.push(predicateList[0]);
	// 		let data = {
	// 			predicate: predicate,
	// 			slice_size: 0,
	// 			accuracy_rate: 0,
	// 			index: 0,
	// 		};
	// 		slice_data.push(data);
	// 	} else {
	// 		slice_data = [];
	// 		slices_of_interest.forEach((element, i) => {
	// 			let predicate = [];
	// 			let predicates_store = element.filterPredicates.predicates;
	// 			for (let k = 0; k < predicates_store.length; k++) {
	// 				predicate.push(
	// 					predicates_store[k].column.name +
	// 						predicates_store[k].operation +
	// 						predicates_store[k].value
	// 				);
	// 			}
	// 			let data = {
	// 				predicate: predicate,
	// 				slice_size: all_metrics[i][0].size,
	// 				accuracy_rate: all_metrics[i][0].metric,
	// 				index: i,
	// 			};
	// 			slice_data.push(data);
	// 		});

	// 		if (orderBy === "descending") {
	// 			slice_data.reverse();
	// 		}
	// 	}
	// }

	// get_all_valid_columns();
	// slice_data_generator();
</script>

<svelte:window on:keydown={submit} />
{#if showSliceFinder}
	<div class="coverage" transition:fade />
{/if}
<div
	id="slice-finder-container"
	style="justify-content: flex-start;"
	transition:fade
	use:clickOutside
	on:click_outside={() => ($showSliceFinder = false)}>
	<Paper elevation={7}>
		<div class="inline">
			<div class="inline">
				<h4 class="title">Slice Finder</h4>
				<div
					class="information-tooltip"
					use:tooltip={{
						content:
							"Run the SliceLine algorithm to find slices of data with high or low metrics.",
						position: "right",
						theme: "zeno-tooltip",
					}}>
					<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
						<path d={mdiInformationOutline} />
					</Icon>
				</div>
			</div>
			<IconButton on:click={() => ($showSliceFinder = false)}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#6a1b9a" d={mdiClose} />
				</Icon>
			</IconButton>
		</div>
		<div class="metrics">
			<Svelecte
				style="margin-left: 20px; margin-right: 20px; flex:none;"
				bind:value={metricColumn}
				valueAsObject={true}
				valueField={"name"}
				labelField={"name"}
				options={metricColumns}
				placeholder="Metric Column" />
			<Select
				class="select"
				bind:value={minimumSize}
				label="Minimum Size"
				style="width: 170px">
				{#each minimumSizes as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={maxL}
				label="Max Lattice Level"
				style="width: 170px">
				{#each maxLs as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={orderBy}
				label="Order By"
				style="width: 170px">
				{#each orderByOptions as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>

			<div class="options-header">Model</div>
			<Svelecte
				style="margin-left: 20px; margin-right: 20px; flex:none;"
				bind:value={searchColumns}
				valueAsObject={true}
				valueField={"name"}
				labelField={"name"}
				options={searchColumnOptions}
				multiple={true}
				placeholder="Slicing Columns" />

			<Button on:click={() => activateSliceFinder()}>Generate Slices</Button>
			<span id="generate-slices">{sliceFinderMessage}</span>

			<!-- {#each slice_data as element}
				<div class="allSlices">
					
					<SliceDetails slice.filterGroup />
					{#each element.predicate as pred}
						<Chip bind:chip={pred} class="label meta-chip"
							><Label>
								{pred}
							</Label></Chip>
					{/each}
					<span>
						<IconButton
							class="rightElement"
							style="margin-top:-6px;"
							on:click={() => addSliceAtIndex(element.index)}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="#6a1b9a" d={mdiPlus} />
							</Icon>
						</IconButton>
					</span>
					<span class="rightElement" style="margin-top:10px;color:gray;"
						>{"(" + element.slice_size + ")"}</span>
					<span class="rightElement" style="margin-top:10px;"
						>{Math.round(element.accuracy_rate)}</span>
				</div>
			{/each} -->
		</div>
	</Paper>
</div>

<style>
	#slice-finder-container {
		position: fixed;
		top: 8vh;
		margin-left: 10vw;
		z-index: 10;
		min-width: 70vw;
	}
	.options-header {
		margin-left: 20px;
		margin-top: 15px;
		margin-bottom: 5px;
		color: var(--G2);
	}
	.title {
		text-align: left;
		padding-left: 20px;
	}
	.inline {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.metrics {
		justify-content: space-between;
	}
	.metrics :global(.select) {
		margin-left: 20px;
		padding-right: 15px;
	}
	.coverage {
		position: fixed;
		background: rgba(0, 0, 0, 0.3);
		width: 500vw;
		height: 500vh;
		margin-left: -100vw;
		margin-top: -100vh;
		z-index: 9;
	}
	.metrics :global(.label) {
		background-color: rgba(230, 222, 237, 1);
		color: black;
		margin-left: 20px;
	}
	.metrics :global(.rightElement) {
		align-items: baseline;
		float: right;
		margin-right: 25px;
	}
	.allSlices {
		margin-top: 10px;
		margin-bottom: 10px;
		justify-content: space-between;
	}
	.metrics :global(.meta-chip) {
		padding: 5px;
		background: rgba(230, 222, 237, 1);
		border: 1px solid #e8e8e8;
		margin-left: 10px;
		margin-right: 10px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
