<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import FitLegendaryScatter from "./scatterplot/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import * as d3chromatic from "d3-scale-chromatic";
	import Button from "@smui/button";
	import TextField from "@smui/textfield";
	import {
		projectEmbeddings2D,
		interpolateColorToArray,
		binContinuous,
		getDataRange as uniqueOutputs,
	} from "./discovery";
	import * as pipeline from "./pipeline";
	import {
		filteredTable,
		model,
		settings,
		colorByHash,
		colorSpec,
		table,
		metadataSelections,
		sliceSelections,
	} from "../stores";
	import { columnHash } from "../util";

	import type { dataType } from "./discovery";
	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import * as aq from "arquero";

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

	$: pointsExist = idProjection2D.length > 0;

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

	let applications = [];
	function filterIdsTable(
		table: ColumnTable,
		idColumn: string = columnHash($settings.idColumn),
		ids: string[]
	) {
		let rows = [];
		for (const row of $filteredTable) {
			if (ids.includes(row[idColumn])) {
				rows.push(row);
			}
		}
		let accumulate = {};
		rows.forEach((row) => {
			Object.keys(row).forEach((key) => {
				if (!(key in accumulate)) {
					accumulate[key] = [];
				}
				accumulate[key].push(row[key]);
			});
		});
		const newTable = aq.table(accumulate);
		return newTable;
	}

	$: {
		if ($model && $table) {
			pipeline.reset().then(() => {
				console.log("reset");
			});
			pipeline.init({ model: $model }).then(() => {
				console.log("init");
			});
		}
	}
	let regionLabeler = false;
	let regionPolygon = [];
	let regionLabelerName = "name";
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
						const idedInstanced = detail.map(({ id }) => id);
						lassoSelectTable = filterIdsTable(
							$filteredTable,
							columnHash($settings.idColumn),
							idedInstanced
						);
					}}
					bind:regionPolygon
					regionMode={regionLabeler} />
			</div>
			<div>
				<p>{$filteredTable.size} instances</p>
				<SelectionBar />
			</div>
		</div>
		<div>
			<Button
				variant="outlined"
				on:click={() => {
					console.log("hit");
				}}
				>Change Base, Add new filter
			</Button>
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
						applications = [
							...applications,
							{
								name: "first projection",
								state: {
									projection: idProjection2D,
									table: $filteredTable,
									filterInfo: {
										metadata: $metadataSelections,
										slice: $sliceSelections,
									},
								},
							},
						];
					}
				}}
				>Initial Projection w/ Sidebar Filter
			</Button>
			<Button
				variant="outlined"
				on:click={async () => {
					if ($filteredTable) {
						const filteredIds = lassoSelectTable.columnArray(
							columnHash($settings.idColumn)
						);
						const _projection = await projectEmbeddings2D($model, filteredIds);
						idProjection2D = _projection.data;
						applications = [
							...applications,
							{
								name: "lasso select projection",
								state: {
									projection: idProjection2D,
									table: lassoSelectTable,
									filterInfo: {
										metadata: $metadataSelections,
										slice: $sliceSelections,
									},
								},
							},
						];
					}
				}}
				>Selection Projection
			</Button>
			<Button
				on:click={async () => {
					const output = await pipeline.parametricUMAP();
					idProjection2D = output;
				}}>
				UMAP</Button>
			<Button
				on:click={async () => {
					const tableIds = $filteredTable.columnArray(
						columnHash($settings.idColumn)
					);
					const output = await pipeline.idFilter({ ids: tableIds });
				}}>
				Filter by metadata panel</Button>
			<Button
				on:click={async () => {
					const lassoedIds = lassoSelectTable.columnArray(
						columnHash($settings.idColumn)
					);
					const output = await pipeline.idFilter({ ids: lassoedIds });
				}}>
				Filter by lasso selection</Button>
			<Button on:click={() => (regionLabeler = !regionLabeler)}
				>Draw Polygon: {regionPolygon.length}</Button>
			<Button
				on:click={async () => {
					const output = await pipeline.regionLabeler({
						polygon: regionPolygon,
						name: regionLabelerName,
					});
					const col = output["col_name"];
					const model = col.model;
					const name = col.name;
					const columnType = col.column_type;
					const transform = col.transform;
					const newAddition = {
						model,
						name,
						columnType,
						transform,
					};
					$settings.metadataColumns.push(newAddition);
					settings.set({ ...$settings });
				}}>
				Apply Region Labeler</Button>

			<TextField bind:value={regionLabelerName} label={"Labeler Name"} />
		</div>
		<div>
			<Button
				on:click={async () => {
					const reset = await pipeline.reset();
					const init = await pipeline.init({ model: $model });
				}}>Reset Pipeline with model: {$model}</Button>
		</div>
		<div>
			<h3>History</h3>
			{#each applications as app, i}
				<div
					on:click={() => {
						idProjection2D = app.state.projection;
						metadataSelections.set(app.state.filterInfo.metadata);
						sliceSelections.set(app.state.filterInfo.slice);
					}}>
					NAME: {app.name}, PROJ LENGTH: {app.state.projection.length}
				</div>
			{/each}
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
