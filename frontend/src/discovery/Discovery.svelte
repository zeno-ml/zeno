<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import Scatter from "./scatterplot/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import Button from "@smui/button";
	import TextField from "@smui/textfield";
	import { projectEmbeddings2D } from "./discovery";
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

	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import * as aq from "arquero";

	// props
	export let scatterWidth = 900;
	export let scatterHeight = 700;

	let projection2D: object[] = [];
	let lassoSelectTable = null;
	let regionLabeler = false;
	let regionPolygon = [];
	let regionLabelerName = "name";
	let legendaryScatterPoints: LegendaryScatterPoint[];

	$: metadataExists =
		$settings.metadataColumns.length > 0 || $filteredTable._names.length > 0;
	$: pointsExist = projection2D.length > 0;

	$: {
		if (metadataExists && pointsExist && $colorSpec) {
			legendaryScatterPoints = projection2D.map((item) => {
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

	function scatterSelectEmpty(table: ColumnTable) {
		return table === null;
	}
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
				<Scatter
					width={scatterWidth}
					height={scatterHeight}
					points={legendaryScatterPoints}
					on:deselect={() => {
						lassoSelectTable = null;
					}}
					on:select={({ detail }) => {
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
				on:click={async () => {
					const output = await pipeline.parametricUMAP();
					projection2D = output;
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
