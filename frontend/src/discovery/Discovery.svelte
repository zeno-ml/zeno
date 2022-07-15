<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import Scatter from "./scatterplot/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import Button from "@smui/button";
	import TextField from "@smui/textfield";
	import * as pipeline from "./pipeline";
	import {
		filteredTable,
		model,
		settings,
		colorByHash,
		colorSpec,
		table,
	} from "../stores";
	import { columnHash } from "../util";

	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import * as aq from "arquero";

	// props
	export let scatterWidth = 800;
	export let scatterHeight = 550;

	console.warn = () => {
		return;
	};

	let projection2D: object[] = [];
	let lassoSelectTable = null;
	let regionLabeler = false;
	let regionPolygon = [];
	let regionLabelerName = "name";
	let legendaryScatterPoints: LegendaryScatterPoint[] = [];
	let pipelineJSON: { pipeline: any[]; labeler: null | any } = {
		pipeline: [],
		labeler: null,
	};

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

	const PIPELINE_ID = "nice";
	$: {
		if ($model && $table) {
			// pipeline.reset().then(() => {
			// 	console.log("reset");
			// });
			// pipeline.init({ model: $model, uid: PIPELINE_ID }).then(() => {
			// 	console.log("init");
			// });
			pipeline.load({ model: $model, uid: PIPELINE_ID }).then((d) => {
				if (d !== null) {
					projection2D = d;
				}
			});

			pipeline.pipelineJSON().then((d) => {
				pipelineJSON = d;
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

	function addZenoColumn({
		model = "",
		name = "",
		columnType,
		transform = "",
	}: ZenoColumn) {
		$settings.metadataColumns.push({ model, name, columnType, transform });
		settings.set({ ...$settings });
	}
</script>

<div id="main">
	<MetadataBar />

	<div>
		<div
			id="scatter-view"
			style:margin-top="10px"
			style:height="{scatterHeight}px">
			<div id="pipeline-view" class="paper" style:height="{scatterHeight}px">
				<h4>Pipeline</h4>
				<div>
					<div id="weak-labeler-pipeline">
						{#each pipelineJSON.pipeline as pipe}
							<div class="meta-chip pipe">{pipe.type}</div>
						{:else}
							<div>Empty pipeline</div>
						{/each}
						{#if pipelineJSON.labeler !== null}
							<div>{pipelineJSON.labeler.type}</div>
						{/if}
					</div>
					<div>
						<Button
							title="Click to Filter Current Selection"
							variant="outlined"
							on:click={async () => {
								return;
							}}>
							Filter</Button>
						<Button
							variant="outlined"
							title="Click to Project with UMAP"
							on:click={async () => {
								const output = await pipeline.parametricUMAP();
								projection2D = output;
								pipelineJSON = await pipeline.pipelineJSON();
							}}>
							Project</Button>
					</div>
					<div>
						<Button
							title="Reset entire pipeline"
							on:click={async () => {
								await pipeline.reset();
								await pipeline.init({ model: $model, uid: PIPELINE_ID });
								projection2D = [];
								legendaryScatterPoints = [];
								pipelineJSON = await pipeline.pipelineJSON();
							}}>
							Reset</Button>
					</div>
					<!-- <Button
						on:click={async () => {
							const tableIds = $filteredTable.columnArray(
								columnHash($settings.idColumn)
							);
							const output = await pipeline.idFilter({ ids: tableIds });
							pipelineJSON = await pipeline.pipelineJSON();
						}}>
						Filter by metadata panel</Button>
					<Button
						on:click={async () => {
							const lassoedIds = lassoSelectTable.columnArray(
								columnHash($settings.idColumn)
							);
							const output = await pipeline.idFilter({ ids: lassoedIds });
							pipelineJSON = await pipeline.pipelineJSON();
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
							const column = output["col_name"];
							addZenoColumn({
								model: column.model,
								name: column.name,
								columnType: column.column_type,
								transform: column.transform,
							});
							pipelineJSON = await pipeline.pipelineJSON();
						}}>
						Apply Region Labeler</Button>

					<TextField bind:value={regionLabelerName} label={"Labeler Name"} /> -->
				</div>
				<!-- <div>
					<Button
						on:click={async () => {
							const reset = await pipeline.reset();
							const init = await pipeline.init({
								model: $model,
								uid: PIPELINE_ID,
							});
							pipelineJSON = await pipeline.pipelineJSON();
						}}>Reset Pipeline with model: {$model}</Button>
				</div>
				<div>
					<Button
						on:click={async () => {
							pipelineJSON = await pipeline.pipelineJSON();
							console.log(pipelineJSON);
						}}>Get json pipeline repr</Button>
				</div>
				<div>
					<h3>Pipeline</h3>
					{#each pipelineJSON.pipeline as pipe}
						<div>{pipe.type}</div>
					{:else}
						<div>Empty pipeline</div>
					{/each}
					{#if pipelineJSON.labeler !== null}
						<div>{pipelineJSON.labeler.type}</div>
					{/if}
				</div> -->
			</div>

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
		</div>
		<div
			class="horizontal-divider"
			style:margin-top="10px"
			style:margin-bottom="5px" />
		<!-- Instances view -->
		<div id="instance-view">
			<div id="samples-view">
				<SampleOptions />
				<Samples
					table={scatterSelectEmpty(lassoSelectTable)
						? $filteredTable
						: lassoSelectTable} />
			</div>
		</div>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
	.shadow-paper {
		box-shadow: 0px 0px 3px 3px hsla(0, 0%, 0%, 0.1);
	}
	.paper {
		border: 1px #e0e0e0 solid;
	}
	#scatter-view {
		display: flex;
		justify-content: center;
		gap: 10px;
	}
	#instance-view {
		display: flex;
	}
	#pipeline-view {
		width: 400px;
		padding-left: 10px;
		padding-right: 10px;
		overflow-y: scroll;
	}
	#samples-view {
	}
	.vertical-divider {
		width: 1px;
		background-color: #e0e0e0;
		height: 100%;
	}
	.horizontal-divider {
		width: 100%;
		background-color: #e0e0e0;
		height: 1px;
	}

	h4 {
		font-weight: 500;
		color: rgba(0, 0, 0, 0.7);
	}

	.meta-chip {
		padding: 5px;
		background: rgba(0, 0, 0, 0.07);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
	#weak-labeler-pipeline {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
</style>
