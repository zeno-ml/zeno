<script lang="ts">
	import { mdiClose, mdiInformationOutline } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import { tooltip } from "@svelte-plugins/tooltips";
	import Svelecte from "svelecte";
	import { model, showSliceFinder, status, tab } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import {
		MetadataType,
		ZenoColumnType,
		ZenoService,
		type SliceFinderReturn,
	} from "../../zenoservice";
	import SliceFinderCell from "../cells/SliceFinderCell.svelte";

	let blur = function (ev) {
		ev.target.blur();
	};

	let notEmbedUniqCols = $status.completeColumns.filter(
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
			notEmbedUniqCols.includes(d)
	);
	let searchColumns = [searchColumnOptions[0]];

	// Column to use as the metric to compare slices.
	let metricColumns = $status.completeColumns.filter(
		(d) =>
			(d.metadataType === MetadataType.CONTINUOUS ||
				d.metadataType === MetadataType.BOOLEAN) &&
			notEmbedUniqCols.includes(d)
	);
	let metricColumn = metricColumns.length > 0 ? metricColumns[0] : null;

	let alphas = ["0.5", "0.75", "0.9", "0.95", "0.99", "0.999"];
	let alphaIdx = 4;
	let maxlattice = ["1", "2", "3", "4", "5", "6"];
	let maxlatticeIdx = 3;
	let orderByOptions = ["descending", "ascending"];
	let orderByIdx = 0;

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
		});

		if (sliceFinderReturn.slices.length === 0) {
			sliceFinderMessage = "No slices found, try increasing alpha.";
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
								: "Run the SliceLine algorithm to find slices with the highest average difference in a metric column between two models.",
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
				<div class="options-header">Metric Column</div>
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
				<div class="options-header">Search Columns</div>
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
							content: "Increase alpha to find more slices",
							theme: "zeno-tooltip",
							maxWidth: "250",
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
							content: "Order by slice score, a combination of size and metric",
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
					style="width: 120px; margin-right: 20px"
					bind:value={orderByIdx}
					options={orderByOptions}
					placeholder="Order By" />
			</div>
		</div>
		{#if sliceFinderReturn.slices.length > 0}
			<div class="generation">
				<Button
					variant="outlined"
					style="color:white; background-color: var(--P2);"
					on:click={() => generateSlices()}
					on:mouseleave={blur}
					on:focusout={blur}>
					Generate Slices
				</Button>
				<span>{sliceFinderMessage}</span>
				<div>
					<span class="average"> Overall Average: </span>
					<span class="average-value" style="color: var(--logo);">
						{sliceFinderReturn.overallMetric.toFixed(3)}
					</span>
				</div>
			</div>
			<div class="generation" style="margin-bottom:0px;">
				<h4 style="margin-bottom:0px;">Filter Predicates</h4>
				<h4 style="margin-bottom:0px;">
					Slice Average Metric {$tab !== "comparison" ? "" : "difference"}
				</h4>
			</div>
		{:else}
			<div id="initial">
				<span class="intial-text" style="font-weight: bold">
					Click below to find slices with {$tab !== "comparison"
						? "low performance"
						: "the highest difference"}!
				</span>
				<Button
					variant="outlined"
					style="color:white; background-color: var(--P2);"
					on:click={() => generateSlices()}
					on:mouseleave={blur}
					on:focusout={blur}>
					Generate Slices
				</Button>
				<span class="intial-text">{sliceFinderMessage}</span>
			</div>
		{/if}
		{#each sliceFinderReturn.slices as slice, idx}
			{@const metric = sliceFinderReturn.metrics[idx].toFixed(3)}
			{@const size = sliceFinderReturn.sizes[idx]}
			<SliceFinderCell {slice} {metric} {size} />
		{/each}
	</Paper>
</div>

<style>
	.intial-text {
		margin: 10px;
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
		height: 25vh;
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
