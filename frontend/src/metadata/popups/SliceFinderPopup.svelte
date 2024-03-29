<script lang="ts">
	import { mdiClose, mdiInformationOutline } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import { tooltip } from "@svelte-plugins/tooltips";
	import Svelecte from "svelecte";
	import {
		comparisonModel,
		model,
		selections,
		selectionIds,
		selectionPredicates,
		showSliceFinder,
		status,
		tab,
		tagIds,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import {
		MetadataType,
		ZenoColumnType,
		ZenoService,
		type SliceFinderReturn,
	} from "../../zenoservice";
	import SliceFinderCell from "../cells/SliceFinderCell.svelte";
	import ChipsWrapper from "../ChipsWrapper.svelte";
	import { columnSort } from "../../util/util";

	let blur = function (ev) {
		ev.target.blur();
	};

	let completeColumns = $status.completeColumns.filter(
		(d) =>
			d.columnType === ZenoColumnType.METADATA ||
			d.columnType === ZenoColumnType.PREDISTILL ||
			((d.columnType === ZenoColumnType.OUTPUT ||
				d.columnType === ZenoColumnType.POSTDISTILL) &&
				d.model === $model)
	);

	// Columns to create candidate slices accross
	let searchColumnOptions = $status.completeColumns.filter(
		(d) =>
			d.metadataType !== MetadataType.OTHER &&
			d.metadataType !== MetadataType.DATETIME &&
			completeColumns.includes(d)
	);
	let postdistillColumnOptions = searchColumnOptions.filter(
		(col) => col.columnType === ZenoColumnType.PREDISTILL
	);
	let searchColumns =
		postdistillColumnOptions.length > 0
			? postdistillColumnOptions
			: [searchColumnOptions[0]];

	// Column to use as the metric to compare slices.
	let metricColumns = $status.completeColumns
		.filter((d) => {
			return $tab !== "comparison"
				? (d.metadataType === MetadataType.CONTINUOUS ||
						d.metadataType === MetadataType.BOOLEAN) &&
						completeColumns.includes(d)
				: (d.columnType === ZenoColumnType.OUTPUT ||
						d.columnType === ZenoColumnType.POSTDISTILL) &&
						d.model === $model;
		})
		.sort(columnSort);
	let metricColumn = metricColumns.length > 0 ? metricColumns[0] : null;
	let compareColumn = undefined;
	$: if (metricColumn && $tab === "comparison") {
		compareColumn = Object.assign({}, metricColumn);
		if (compareColumn.model) {
			compareColumn.model = $comparisonModel;
		}
	}

	let alphas = ["0.5", "0.75", "0.9", "0.95", "0.99", "0.999"];
	let alphaIdx = 4;
	let maxlattice = ["1", "2", "3", "4", "5", "6"];
	let maxlatticeIdx = 3;
	let orderByOptions = ["descending", "ascending"];
	let orderByIdx = $tab !== "comparison" ? 1 : 0;

	let sliceFinderReturn = {
		slices: [],
		metrics: [],
		sizes: [],
		overallMetric: null,
	} as SliceFinderReturn;

	$: sliceFinderMessage = "";

	/** Run sliceline algorithm to generate recommended slices **/
	export async function generateSlices() {
		if (searchColumns.length === 0 || metricColumn === null) {
			sliceFinderMessage =
				"Must have a metric column and at least one search column.";
			return;
		}
		if (alphaIdx === null || maxlattice === null || orderByIdx === null) {
			sliceFinderMessage =
				"Parameters (Alpha, Max. Lattice, Order By) can't be null.";
			return;
		}

		sliceFinderMessage = "Generating Slices...";
		sliceFinderReturn = await ZenoService.runSliceFinder({
			metricColumn,
			searchColumns,
			orderBy: orderByOptions[orderByIdx],
			alpha: parseFloat(alphas[alphaIdx]),
			maxLattice: parseInt(maxlattice[maxlatticeIdx]),
			compareColumn,
			filterPredicates: $selectionPredicates,
			tagIds: $tagIds,
			filterIds: $selectionIds,
			tagList: $selections.tags,
		});

		if (sliceFinderReturn.slices.length === 0) {
			sliceFinderMessage =
				"No slices found, try to increase alpha or add more search columns or predicates.";
		} else {
			sliceFinderMessage = "";
		}
	}

	/** Define keyboard actions **/
	function submit(e) {
		if ($showSliceFinder && e.key === "Escape") {
			$showSliceFinder = false;
		}
	}
</script>

<svelte:window on:keydown={submit} />
{#if $showSliceFinder}
	<div class="coverage" />
{/if}
<div
	id="slice-finder-container"
	use:clickOutside
	on:click_outside={() => ($showSliceFinder = false)}>
	<Paper style="min-height: 50vh;" elevation={7}>
		<div class="inline-justify">
			<div class="inline">
				<h3 class="title">Slice Finder</h3>
				<div
					class="information-tooltip"
					use:tooltip={{
						content:
							$tab !== "comparison"
								? "Run the SliceLine algorithm to find slices of data with high or low metrics."
								: "Run the SliceLine algorithm to find slices with the largest or smallest average difference in a difference column between two models.",
						position: "right",
						theme: "zeno-tooltip",
						maxWidth: "350",
					}}>
					<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
						<path d={mdiInformationOutline} />
					</Icon>
				</div>
			</div>
			<IconButton on:click={() => ($showSliceFinder = false)}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path d={mdiClose} />
				</Icon>
			</IconButton>
		</div>
		<div class="inline">
			<div style:margin-left={"20px"}>
				<div style="display:flex">
					<div class="options-header">
						{$tab !== "comparison" ? "Metric Column" : "Difference Column"}
					</div>
					<div
						class="information-tooltip"
						style="margin-top: 3px;"
						use:tooltip={{
							content:
								$tab !== "comparison"
									? "The continuous column to compare slices across"
									: "The column on which to measure model disagreement",
							position: "right",
							theme: "zeno-tooltip",
							maxWidth: "450",
						}}>
						<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
							<path d={mdiInformationOutline} />
						</Icon>
					</div>
				</div>
				<Svelecte
					style="margin-right: 5px; width: 175px"
					bind:value={metricColumn}
					valueAsObject={true}
					valueField={"name"}
					labelField={"name"}
					options={metricColumns}
					placeholder="Metric Column" />
			</div>
			<div style:width="100%">
				<div style="display:flex">
					<div class="options-header">Search Columns</div>
					<div
						class="information-tooltip"
						style="margin-top: 3px;"
						use:tooltip={{
							content: "Metadata columns used to create slices",
							position: "top",
							theme: "zeno-tooltip",
							maxWidth: "450",
						}}>
						<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
							<path d={mdiInformationOutline} />
						</Icon>
					</div>
				</div>
				<Svelecte
					style="margin-right: 5px;"
					bind:value={searchColumns}
					valueField={"name"}
					labelField={"name"}
					valueAsObject={true}
					options={searchColumnOptions}
					multiple={true}
					placeholder="Slicing Columns" />
			</div>
			<div>
				<div style="display:flex">
					<div class="options-header">Alpha</div>
					<div
						class="information-tooltip"
						style="margin-top: 3px;"
						use:tooltip={{
							content:
								"Weight parameter for the average slice metric. Increase it to find more slices.",
							theme: "zeno-tooltip",
							maxWidth: "195",
							position: "left",
						}}>
						<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
							<path d={mdiInformationOutline} />
						</Icon>
					</div>
				</div>
				<Svelecte
					style="margin-right: 5px; width: 80px"
					bind:value={alphaIdx}
					options={alphas}
					required={true}
					placeholder="Alpha" />
			</div>
			<div>
				<div style="display:flex">
					<div class="options-header">Max. Lattice</div>
					<div
						class="information-tooltip"
						style="margin-top: 3px;"
						use:tooltip={{
							content: "Maximum number of predicates",
							theme: "zeno-tooltip",
							maxWidth: "270",
						}}>
						<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
							<path d={mdiInformationOutline} />
						</Icon>
					</div>
				</div>
				<Svelecte
					style="margin-right: 5px; width: 120px"
					bind:value={maxlatticeIdx}
					options={maxlattice}
					placeholder="Maximum lattice level" />
			</div>
			<div>
				<div style="display:flex">
					<div class="options-header">Order By</div>
					<div
						class="information-tooltip"
						style="margin-top: 3px;"
						use:tooltip={{
							content:
								$tab !== "comparison"
									? "Order by slice score, a combination of metric and size"
									: "Order by slice score, a combination of model difference and size",
							theme: "zeno-tooltip",
							position: "left",
							maxWidth: "250",
						}}>
						<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
							<path d={mdiInformationOutline} />
						</Icon>
					</div>
				</div>
				<Svelecte
					style="width: 130px; margin-right: 20px"
					bind:value={orderByIdx}
					options={$tab !== "comparison"
						? orderByOptions
						: ["(model) A > B", "(model) B > A"]}
					placeholder="Order By" />
			</div>
		</div>
		{#if $selectionPredicates.predicates.length + $selections.tags.length > 0 || $selectionIds.ids.length > 0}
			<div style="margin-left: 20px;margin-right: 20px">
				<div class="options-header">Search for slices in:</div>
				<div class="chipbar">
					<ChipsWrapper />
				</div>
			</div>
		{/if}
		{#if sliceFinderReturn.slices.length > 0}
			<div class="generation">
				<Button
					variant="outlined"
					style="color:white; background-color: var(--logo);"
					on:click={() => generateSlices()}
					on:mouseleave={blur}
					on:focusout={blur}>
					Generate Slices
				</Button>
				<span class="message">{sliceFinderMessage}</span>
				<div>
					<span class="average"> Overall Average: </span>
					<span class="average-value" style="color: var(--logo);">
						{sliceFinderReturn.overallMetric.toFixed(2)}
					</span>
				</div>
			</div>
			<div class="generation" style="margin-bottom:0px;">
				<h4 style="margin-bottom:0px;">Filter Predicates</h4>
				<h4 style="margin-bottom:0px;">
					Average Slice Metric {$tab !== "comparison" ? "" : "difference"}
				</h4>
			</div>
		{:else}
			<div id="initial">
				<Button
					variant="outlined"
					style="color:white; background-color: var(--logo);"
					on:click={() => generateSlices()}
					on:mouseleave={blur}
					on:focusout={blur}>
					Generate Slices
				</Button>
				<span class="intial-text">
					Find slices with {$tab !== "comparison"
						? "the lowest performance"
						: "the largest difference"}
				</span>
				<span class="message">{sliceFinderMessage}</span>
			</div>
		{/if}
		{#each sliceFinderReturn.slices as slice, idx}
			{@const metric = sliceFinderReturn.metrics[idx].toFixed(2)}
			{@const size = sliceFinderReturn.sizes[idx]}
			<SliceFinderCell {slice} {metric} {size} />
		{/each}
	</Paper>
</div>

<style>
	.intial-text {
		margin: 20px 10px 10px 10px;
		font-size: 16px;
	}
	.message {
		font-size: 14px;
		margin: 10px;
	}
	.chipbar {
		display: flex;
		flex-direction: row;
		border: 1px solid var(--G4);
		border-radius: 4px;
	}
	#slice-finder-container {
		max-height: calc(100vh - 150px);
		overflow: auto;
		position: fixed;
		top: 8vh;
		margin-left: 17vw;
		z-index: 10;
		min-width: 60vw;
		max-width: 60vw;
	}
	.average {
		font-weight: 400;
		color: var(--G2);
		margin-right: 15px;
	}
	#initial {
		display: flex;
		flex-direction: column;
		height: 28vh;
		margin: 20px;
		align-items: center;
		justify-content: center;
	}
	.generation {
		margin: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.options-header {
		margin-top: 5px;
		margin-bottom: 5px;
		color: var(--G2);
	}
	.title {
		text-align: left;
		padding-left: 20px;
		margin-bottom: 0px;
		margin-top: 0px;
	}
	.inline {
		display: flex;
		align-items: center;
	}
	.inline-justify {
		display: flex;
		align-items: center;
		justify-content: space-between;
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
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
