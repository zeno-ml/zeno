<script lang="ts">
	import { mdiClose, mdiInformationOutline, mdiPlus } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import { tooltip } from "@svelte-plugins/tooltips";
	import Svelecte from "svelecte";
	import SliceDetails from "../../general/SliceDetails.svelte";
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
		searchColumnOptions.length > 0
			? Object.assign([], searchColumnOptions)
			: [];

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
	let metricColumn = metricColumns.length > 0 ? metricColumns[0] : null;

	let alphas = ["0.5", "0.75", "0.9", "0.95", "0.99", "0.999"];
	let alphaIdx = 3;
	let minimumSupps = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
	let minimumSuppIdx = 0;
	let orderByOptions = ["descending", "ascending"];
	let orderByIdx = 0;

	let sliceFinderReturn = {
		slices: [],
		metrics: [],
		sizes: [],
		overallMetric: null,
	} as SliceFinderReturn;

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
		if (searchColumns.length === 0 || metricColumn === null) {
			sliceFinderMessage =
				"Must have a metric column and at least one search column.";
			return;
		}

		sliceFinderMessage = "Generating Slices...";
		sliceFinderReturn = await ZenoService.runSliceFinder({
			columns: searchColumns,
			metricColumn: metricColumn,
			orderBy: orderByOptions[orderByIdx],
			minimumSupp: parseInt(minimumSupps[minimumSuppIdx]),
			alpha: parseFloat(alphas[alphaIdx]),
		});

		if (sliceFinderReturn.slices.length === 0) {
			sliceFinderMessage = "No slices found, try increasing alpha";
		} else {
			sliceFinderMessage = "";
		}
	}

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
					valueAsObject={true}
					options={searchColumnOptions}
					multiple={true}
					placeholder="Slicing Columns" />
			</div>
			<div>
				<div class="options-header">Alpha</div>
				<Svelecte
					style="margin-right: 5px; width: 80px"
					bind:value={alphaIdx}
					options={alphas}
					required={true}
					placeholder="Alpha" />
			</div>
			<div>
				<div class="options-header">Min. Support</div>
				<Svelecte
					style="margin-right: 5px; width: 100px"
					bind:value={minimumSuppIdx}
					options={minimumSupps}
					placeholder="Minimum Support Threshold" />
			</div>
			<div>
				<div class="options-header">Order By</div>
				<Svelecte
					style="width: 120px; margin-right: 20px"
					bind:value={orderByIdx}
					options={orderByOptions}
					placeholder="Order By" />
			</div>
		</div>

		<div id="generation">
			<Button variant="outlined" on:click={() => activateSliceFinder()}>
				Generate Slices
			</Button>
			<span id="generate-slices">{sliceFinderMessage}</span>
			<span id="overall">
				{sliceFinderReturn.overallMetric !== null
					? "Average: " + sliceFinderReturn.overallMetric.toFixed(3)
					: ""}
			</span>
		</div>

		{#each sliceFinderReturn.slices as element, idx}
			<div class="slice">
				<span style="display: inline-block;">
					<SliceDetails predicateGroup={element.filterPredicates} />
				</span>
				<div class="inline">
					<span style="margin-right: 10px; margin-left: 10px">
						{sliceFinderReturn.metrics[idx].toFixed(3)}
					</span>
					<span style="color:gray; font-style: italic">
						{"(" + sliceFinderReturn.sizes[idx] + ")"}
					</span>
					<IconButton on:click={() => addSliceAtIndex(idx)}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="#6a1b9a" d={mdiPlus} />
						</Icon>
					</IconButton>
				</div>
			</div>
		{/each}
	</Paper>
</div>

<style>
	#generate-slices {
		margin-left: 10px;
	}
	#slice-finder-container {
		max-height: calc(100vh - 100px);
		overflow: scroll;
		position: fixed;
		top: 8vh;
		margin-left: 10vw;
		z-index: 10;
		min-width: 70vw;
	}
	#overall {
		position: absolute;
		right: 25px;
	}
	#generation {
		margin-left: 20px;
		margin-top: 20px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
	}
	.options-header {
		margin-top: 15px;
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
	.slice {
		margin-left: 20px;
		display: flex;
		margin-top: 10px;
		margin-bottom: 10px;
		justify-content: space-between;
	}
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
