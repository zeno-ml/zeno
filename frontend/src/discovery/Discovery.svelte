<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import LegendaryScatter from "./scatter/LegendaryScatter.svelte";
	import FitLegendaryScatter from "./fitScatter/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import * as d3chromatic from "d3-scale-chromatic";
	import Button from "@smui/button";
	import {
		projectEmbeddings2D,
		reformatAPI,
		interpolateColorToArray,
		indexTable,
		binContinuous,
		getDataRange as uniqueOutputs,
	} from "./discovery";
	import {
		filteredTable,
		model,
		settings,
		colorByHash,
		colorSpec,
		table,
	} from "../stores";
	import { columnHash } from "../util";

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
	let idProjection2D: object[] = [];
	let colorValues: number[] = [];
	let opacityValues: number[] = [];

	// eslint-disable-next-line
	let dataType: dataType = "categorical";
	let colorRange: string[] = colorsCategorical;
	let lassoSelectTable = null;

	$: console.log("SPEC", $colorByHash, $colorSpec);
	// stuff that gets updated (reactive)
	$: metadataExists =
		$settings.metadataColumns.length > 0 || $filteredTable._names.length > 0;

	$: pointsExist = projection2D.length > 0;

	let oldIds = [],
		newIds = [];
	$: {
		oldIds = saveIds();
		updateColors({ colorBy: $colorByHash });
	}
	$: {
		if (metadataExists && $filteredTable) {
			newIds = saveIds();
		}
	}
	$: {
		opacityValues = oldIds.map((id) => (newIds.includes(id) ? 0.75 : 0.15));
	}
	$: {
		if (metadataExists && pointsExist && $colorSpec) {
			legendaryScatterPoints = idProjection2D.map((item) => {
				const proj = item["proj"],
					id = item["id"];
				return {
					x: proj[0],
					y: proj[1],
					opacity: 0.75,
					color: $colorSpec.labels.find((label) => label.id === id).colorIndex,
					id,
				};
			});
		}
	}

	// functions
	function scatterSelectEmpty(table: ColumnTable) {
		return table === null;
	}
	function saveIds() {
		if ($filteredTable) {
			return $filteredTable
				.columnArray(columnHash($settings.idColumn))
				.map((d) => d) as string[];
		} else {
			return [];
		}
	}
	function getMetadata(table: ColumnTable, colorBy: string) {
		if (table.column(colorBy)) {
			return table.columnArray(colorBy) as Array<unknown>;
		} else {
			return [];
		}
	}

	let selectedMetadataOutputs,
		dataRange,
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
		metadata: unknown[],
		range: unknown[]
	) {
		// based on datatype inferred color differently
		let colorRange, colorValues;
		if (type === "categorical") {
			colorValues = metadata.map((md) => range.indexOf(md));
			colorRange = colorsCategorical;
		} else if (type === "continuous") {
			const binAssignments = binContinuous(metadata);
			colorValues = binAssignments.map((ass) => range[ass]);
			colorRange = interpolateColorToArray(colorsContinuous, range.length);
		}
		return { colorRange, colorValues };
	}
	function updateColors({ colorBy = "label", table = $filteredTable } = {}) {
		// compute coloring stuff
		const { metadata, range, type } = inferOutputsType(colorBy, table);
		const { colorRange: cRange, colorValues: cValues } = selectColorsForRange(
			type,
			metadata,
			range
		);

		// save globally
		selectedMetadataOutputs = metadata;
		dataRange = range;
		// eslint-disable-next-line
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
		const legend = reformatAPI.legendaryScatter.legend(colorRange, dataRange);
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
		console.log(legendaryScatterPoints);
	}
</script>

<div id="main">
	<MetadataBar />
	<div>
		<!-- Color Dropdown -->
		<div id="color-by">
			{#if metadataExists}
				<Select bind:value={$colorByHash} label={"Color Points By"}>
					{#each $settings.metadataColumns as metadataName, i}
						{@const isModelsMetadata =
							(metadataName.model === "" || metadataName.model === $model) &&
							metadataName.name !== $settings.idColumn.name}
						{#if isModelsMetadata}
							<Option value={columnHash(metadataName)}
								>{metadataName.name}</Option>
						{/if}
					{/each}
				</Select>
			{/if}
		</div>

		<!-- Scatter View -->
		<div id="scatter-view" style:margin-top="10px">
			<div
				class="paper"
				style:width="{scatterWidth}px"
				style:height="{scatterHeight}px">
				<FitLegendaryScatter
					width={scatterWidth}
					height={scatterHeight}
					points={legendaryScatterPoints}
					on:deselect={() => {
						lassoSelectTable = null;
					}}
					on:select={({ detail }) => {
						const indexInstances = detail.map(({ index }) => index);
						lassoSelectTable = indexTable(
							$filteredTable,
							indexInstances.map((i) => i + 1)
						);
					}}
					regionMode={false} />
			</div>
			<div>
				<p>{$filteredTable.size} instances</p>
				<SelectionBar />
			</div>
		</div>
		<div>
			<Button
				variant="outlined"
				on:click={async () => {
					if ($filteredTable) {
						const filteredIds = $filteredTable.columnArray(
							columnHash($settings.idColumn)
						);
						const _projection = await projectEmbeddings2D($model, filteredIds);
						projection2D = _projection.data.map(({ proj }) => proj);
						idProjection2D = _projection.data;
					}
				}}
				>Compute projection
			</Button>
		</div>
	</div>

	<!-- Instances view -->
	<div id="instance-view">
		<SampleOptions />
		<Samples
			table={scatterSelectEmpty(lassoSelectTable)
				? $filteredTable
				: lassoSelectTable} />
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
