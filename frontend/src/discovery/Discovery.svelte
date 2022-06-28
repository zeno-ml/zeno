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
		getDataRange as uniqueOutputs,
	} from "./discovery";
	import { filteredTable, model, settings } from "../stores";

	import type { dataType } from "./discovery";
	import type {
		LegendaryScatterPoint,
		LegendaryLegendEntry,
	} from "./scatter/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";

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
	function getMetadata(table: ColumnTable, colorBy: string) {
		return table.columnArray(colorBy) as string[];
	}

	let selectedMetadataOutputs: any[],
		dataRange: any[],
		legendaryScatterLegend: LegendaryLegendEntry[],
		legendaryScatterPoints: LegendaryScatterPoint[];

	function inferOutputsType(
		colorBy: string,
		table: ColumnTable = $filteredTable
	) {
		// get the range and type of data
		const metadata = getMetadata(table, colorBy); // get columns for selected metadata
		const { range, type } = uniqueOutputs(metadata); // return the unique categorical or continuous range
		return { metadata, range, type };
	}
	function selectColorsForRange(
		type: dataType,
		metadata: any[],
		range: any[]
	) {
		// based on datatype inferred color differently
		let colorRange, colorValues;
		if (type === "categorical") {
			colorValues = metadata.map((md) => range.indexOf(md));
			colorRange = d3.schemeCategory10 as string[];
		} else if (type === "continuous") {
			const binAssignments = binContinuous(metadata);
			colorValues = binAssignments.map((ass) => range[ass]);
			colorRange = interpolateColorToArray(
				d3.interpolateBuPu,
				range.length
			);
		}
		return { colorRange, colorValues };
	}
	$: {
		if (metadataExists) {
			// save ids for currently highlighted points
			pointsPlottedIds = saveIds();

			// compute coloring stuff
			const { metadata, range, type } = inferOutputsType(colorBy);
			const { colorRange: cRange, colorValues: cValues } =
				selectColorsForRange(type, metadata, range);

			// save globally
			selectedMetadataOutputs = metadata;
			dataRange = range;
			dataType = type;
			colorRange = cRange;
			colorValues = cValues;
		}
	}

	$: {
		if (metadataExists) {
			newIds = $filteredTable.columnArray("id").map((d) => d) as string[];
		}
	}
	$: {
		if (metadataExists) {
			opacityValues = selectedMetadataOutputs.map((_, i) =>
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
