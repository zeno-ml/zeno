<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import LegendaryScatter from "./scatter/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import * as d3chromatic from "d3-scale-chromatic";
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
	export let colorsCategorical = d3chromatic.schemeCategory10 as string[];
	export let colorsContinuous = d3chromatic.interpolateBuPu;

	let projection2D: number[][] = [];
	let colorValues: number[] = [];
	let opacityValues: number[] = [];
	let colorBy: string = "label";
	let dataType: dataType = "categorical";
	let colorRange: string[] = colorsCategorical;
	let lassoSelectTable = null;

	// stuff that gets updated (reactive)
	$: metadataExists =
		$settings.metadataColumns.length > 0 ||
		$filteredTable._names.length > 0;

	$: pointsExist = projection2D.length > 0;

	// absolutely cursed reactive stuff here
	// whenever stuff is mentioned as the parameter it will update/recompute for that variable
	// so I hid stuff (global variables) within the function so they don't call the reactive on update
	// this cursed black magic can be removed once I get a better copying and caching system down
	// for the pipeline
	let oldIds = [],
		newIds = [];
	$: {
		oldIds = saveIds();
		updateColors({ colorBy });
	}
	$: {
		if (metadataExists && $filteredTable) {
			newIds = saveIds();
		}
	}
	$: {
		opacityValues = oldIds.map((id, i) =>
			newIds.includes(id) ? 0.75 : 0.15
		);
	}
	$: {
		if (metadataExists && pointsExist) {
			updateLegendaryScatter({
				colorRange,
				colorValues,
				dataRange,
				projection2D,
				opacityValues,
			});
		}
	}

	// functions
	function scatterSelectEmpty(table: ColumnTable) {
		return table === null;
	}
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
			colorRange = colorsCategorical;
		} else if (type === "continuous") {
			const binAssignments = binContinuous(metadata);
			colorValues = binAssignments.map((ass) => range[ass]);
			colorRange = interpolateColorToArray(
				colorsContinuous,
				range.length
			);
		}
		return { colorRange, colorValues };
	}
	function updateColors({ colorBy = "label", table = $filteredTable } = {}) {
		// compute coloring stuff
		const { metadata, range, type } = inferOutputsType(colorBy, table);
		const { colorRange: cRange, colorValues: cValues } =
			selectColorsForRange(type, metadata, range);

		// save globally
		selectedMetadataOutputs = metadata;
		dataRange = range;
		dataType = type;
		colorRange = cRange;
		colorValues = cValues;
	}

	function packageLegendaryScatterPoints({
		colorRange,
		dataRange,
		projection2D,
		colorValues,
		opacityValues,
	}) {
		const legend = reformatAPI.legendaryScatter.legend(
			colorRange,
			dataRange
		);
		const scatter = reformatAPI.legendaryScatter.points(
			projection2D,
			colorValues,
			opacityValues
		);
		return { scatter, legend };
	}
	function updateLegendaryScatter({
		colorRange,
		colorValues,
		dataRange,
		opacityValues,
		projection2D,
	}) {
		const { legend, scatter } = packageLegendaryScatterPoints({
			colorRange,
			colorValues,
			dataRange,
			opacityValues,
			projection2D,
		});
		// update global variables for rendering
		legendaryScatterLegend = legend;
		legendaryScatterPoints = scatter;
	}
	function updateOpacity({ projection2D }) {
		opacityValues = projection2D.map((_, i) => 1.0);
	}
</script>

<div id="main">
	<MetadataBar />
	<div>
		<!-- Color Dropdown -->
		<div id="color-by">
			{#if metadataExists}
				<Select bind:value={colorBy} label={"Color Points By"}>
					{#each $settings.metadataColumns as metadataName, i}
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
