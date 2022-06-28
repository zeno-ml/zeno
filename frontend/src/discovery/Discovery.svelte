<script lang="ts">
	import MetadataBar from "../filtering/MetadataBar.svelte";
	import SelectionBar from "../filtering/SelectionBar.svelte";
	import LegendaryScatter from "./scatter/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";

	import * as d3 from "d3";
	import type Table from "arquero/dist/types/table/table";

	import {
		projectEmbeddings2D,
		reformatAPI,
		interpolateColorToArray,
		indexTable,
		binContinuous,
		getDataRange,
	} from "./discovery";
	import { filteredTable, model, settings } from "../stores";

	import type { dataType } from "./discovery";
	import type {
		LegendaryScatterPoint,
		LegendaryLegendEntry,
	} from "./scatter/scatter";

	// props
	export let scatterWidth = 900;
	export let scatterHeight = 700;

	let projection2D: number[][] = [];
	let colorValues: number[] = [];
	let opacityValues: number[] = [];
	let colorBy: string = "label";
	let dataType: dataType = "categorical";
	let colorRange: string[] = d3.schemeCategory10 as string[];
	let lassoSelectTable = null;
	function scatterSelectEmpty(table: Table) {
		return table === null;
	}
	$: metadataExists =
		$settings.metadata.length > 0 || $filteredTable._names.length > 0;

	let pointsPlottedIds = [];
	let newIds: any[] = [];
	function saveIds() {
		return $filteredTable.columnArray("id").map((d) => d) as string[];
	}
	function getMetadata(colorBy: string) {
		return $filteredTable.columnArray(colorBy) as string[];
	}

	let selectedMetadata: any[],
		dataRange: any[],
		legendaryScatterLegend: LegendaryLegendEntry[],
		legendaryScatterPoints: LegendaryScatterPoint[];
	$: if (metadataExists) {
		pointsPlottedIds = saveIds();
		selectedMetadata = getMetadata(colorBy);
		const { range, type } = getDataRange(selectedMetadata);
		const stringifiedRange = range.map((r) => ({ value: r, str: `${r}` }));
		dataRange = stringifiedRange
			.sort((a, b) => a.str.toString().localeCompare(b.str.toString()))
			.map(({ value }) => value);
		dataType = type;
		if (dataType === "categorical") {
			colorValues = selectedMetadata.map((md) => dataRange.indexOf(md));
			colorRange = d3.schemeCategory10 as string[];
		} else if (dataType === "continuous") {
			const binAssignments = binContinuous(selectedMetadata);
			colorValues = binAssignments.map((ass) => dataRange[ass]);
			colorRange = interpolateColorToArray(
				d3.interpolateBuPu,
				dataRange.length
			);
		}
	}
	$: {
		if (metadataExists) {
			newIds = $filteredTable.columnArray("id").map((d) => d) as string[];
		}
	}
	$: {
		if (metadataExists) {
			opacityValues = selectedMetadata.map((_, i) =>
				newIds.includes(pointsPlottedIds[i]) ? 0.75 : 0.15
			);
			legendaryScatterLegend = reformatAPI.legendaryScatter.legend(
				colorRange,
				dataRange
			);
			legendaryScatterPoints = reformatAPI.legendaryScatter.points(
				projection2D,
				colorValues,
				opacityValues
			);
		}
	}
</script>

<div id="main">
	<MetadataBar />
	<div>
		<!-- Color Dropdown -->
		<div id="color-by">
			{#if metadataExists}
				<Select bind:value={colorBy} label={"Color Points By"}>
					{#each $settings.metadata as metadataName, i}
						<Option value={metadataName}>{metadataName}</Option>
					{/each}
				</Select>
			{/if}
		</div>

		<!-- Scatter View -->
		<div id="scatter-view" style:margin-top="10px">
			<div
				class="paper"
				style:width="{scatterWidth}px"
				style:height="{scatterHeight}px"
			>
				<LegendaryScatter
					width={scatterWidth}
					height={scatterHeight}
					legend={legendaryScatterLegend}
					points={legendaryScatterPoints}
					on:deselect={() => {
						lassoSelectTable = null;
					}}
					on:select={({ detail }) => {
						const indexInstances = detail.map(({ index }) => index);
						lassoSelectTable = indexTable(
							$filteredTable,
							indexInstances
						);
					}}
				/>
			</div>
			<div>
				<p>{$filteredTable.size} instances</p>
				<SelectionBar />
			</div>
		</div>
		<div>
			<button
				on:click={async () => {
					if ($filteredTable) {
						const filteredIds = $filteredTable.columnArray("id");
						const _projection = await projectEmbeddings2D(
							$model,
							filteredIds
						);
						projection2D = _projection.data.map(
							({ proj, id }) => proj
						);
					}
				}}
				>Compute projection
			</button>
		</div>
	</div>

	<!-- Instances view -->
	<div id="instance-view">
		<SampleOptions />
		<Samples
			table={scatterSelectEmpty(lassoSelectTable)
				? $filteredTable
				: lassoSelectTable}
		/>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
	.paper {
		box-shadow: 0px 0px 3px 3px hsla(0, 0%, 0%, 0.1);
	}
</style>
