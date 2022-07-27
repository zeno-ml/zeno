<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import Scatter from "./scatterplot/LegendaryScatter.svelte";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import Button from "@smui/button";
	import TextField from "@smui/textfield";
	import * as pipeline from "./pipeline";
	import { filteredTable, model, settings, colorSpec, table } from "../stores";
	import { columnHash } from "../util/util";

	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import * as aq from "arquero";
	import Node from "./node/Node.svelte";

	export let scatterWidth = 800;
	export let scatterHeight = 550;

	const PIPELINE_ID = "initial_pipeline";

	let projection2D: object[] = [];
	let lassoSelectTable = null;
	let regionLabeler = false;
	let regionPolygon = [];
	let regionLabelerName = "name";
	let legendaryScatterPoints: LegendaryScatterPoint[] = [];
	let pipelineRepr: Pipeline.Node[] = [];
	let selectedNode;
	let scatterObj;

	$: metadataExists =
		$settings.metadataColumns.length > 0 || $filteredTable._names.length > 0;
	$: pointsExist = projection2D.length > 0;

	$: {
		if ($model && $table) {
			initPipeline($table, $model);
		}
	}

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

	async function initPipeline(table: ColumnTable, model: string) {
		pipeline.pipelineJSON().then((d) => {
			regionLabelerName = d.name;
			if (d.model !== model) {
				pipelineRepr = [];
				projection2D = [];
				legendaryScatterPoints = [];
			}
		});

		pipeline.load({ model: model, uid: PIPELINE_ID }).then((d) => {
			if (d !== null) {
				if (d.pipeline.length > 0) {
					pipelineRepr = d.pipeline;
					const lastNode = d.pipeline[d.pipeline.length - 1];
					projection2D = lastNode.state.projection;
					selectedNode = lastNode;
				}
			}
		});
	}

	function filterIdsTable(
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

	function resetSelection() {
		scatterObj.select([]);
		lassoSelectTable = null;
	}
</script>

<div id="main">
	<MetadataBar shouldColor />
	<div>
		<div id="scatter-view" style:height="{scatterHeight}px">
			<div id="pipeline-view" style:height="{scatterHeight}px">
				<h4>Pipeline Labeler</h4>
				<div>
					<TextField bind:value={regionLabelerName} label={"Name"} />
				</div>
				<h4>Pipeline</h4>
				<div>
					<div id="weak-labeler-pipeline">
						{#each pipelineRepr as node, i}
							<Node
								{node}
								on:backClick={async () => {
									await pipeline.reset({ upToId: node.id });
									let newSubset = [];
									for (let i = 0; i < pipelineRepr.length; i++) {
										newSubset.push(pipelineRepr[i]);
										if (pipelineRepr[i].id === node.id) {
											break;
										}
									}
									pipelineRepr = newSubset;
									selectedNode = node;
									projection2D = node.state.projection;
								}}
								on:eyeClick={() => {
									selectedNode = node;
									projection2D = node.state.projection;
								}}
								selectedId={selectedNode.id}
								lastNode={i === pipelineRepr.length - 1} />
						{:else}
							<div>Empty pipeline</div>
						{/each}
					</div>
					<div>
						<Button
							title="Click to Filter Current Selection"
							variant="outlined"
							on:click={async () => {
								let tableIds = $filteredTable;
								// if (lassoSelectTable !== null) {
								// 	tableIds = tableIds.intersect(lassoSelectTable);
								// }
								const ids = tableIds.columnArray(
									columnHash($settings.idColumn)
								);
								const node = await pipeline.idFilter({ ids });
								projection2D = node.state.projection;
								resetSelection();
								pipelineRepr = [...pipelineRepr, node];
								selectedNode = node;
							}}>
							Filter</Button>
						<Button
							variant="outlined"
							title="Click to Project with UMAP"
							on:click={async () => {
								const node = await pipeline.parametricUMAP();
								projection2D = node.state.projection;
								pipelineRepr = [...pipelineRepr, node];
								selectedNode = node;
							}}>
							Project</Button>
					</div>
					<div>
						<Button
							title="Reset entire pipeline"
							color={regionLabeler ? "secondary" : "primary"}
							on:click={async () => {
								await pipeline.reset();
								await pipeline.init({ model: $model, uid: PIPELINE_ID });
								projection2D = [];
								legendaryScatterPoints = [];
								regionLabelerName = "default";
								pipelineRepr = [];
							}}>
							Reset</Button>
						<Button
							on:click={async () => {
								if (regionLabeler && regionPolygon.length > 0) {
									const output = await pipeline.regionLabeler({
										polygon: regionPolygon,
										name: regionLabelerName,
										upToId: selectedNode.id,
									});
									const column = output["col_name"];
									addZenoColumn({
										model: column.model,
										name: column.name,
										columnType: column.column_type,
										transform: column.transform,
									});
									regionLabeler = false;
									regionPolygon = [];
								} else {
									regionPolygon = [];
									regionLabeler = true;
								}
							}}>
							{regionLabeler
								? "Click Here to Confirm"
								: "Create Labeler"}</Button>
					</div>
				</div>
			</div>

			<div class="vertical-divider" />

			<div style:width="{scatterWidth}px" style:height="{scatterHeight}px">
				<Scatter
					width={scatterWidth}
					height={scatterHeight}
					points={legendaryScatterPoints}
					colorRange={$colorSpec ? $colorSpec.colors : ["#ccc"]}
					on:create={({ detail }) => {
						scatterObj = detail;
					}}
					on:deselect={() => {
						lassoSelectTable = null;
					}}
					on:select={({ detail }) => {
						const idedInstanced = detail.map(({ id }) => id);
						lassoSelectTable = filterIdsTable(
							columnHash($settings.idColumn),
							idedInstanced
						);
					}}
					bind:regionPolygon
					regionMode={regionLabeler} />
			</div>
		</div>
		<div class="horizontal-divider" style:margin-bottom="5px" />
		<!-- Instances view -->
		<div id="samples-view">
			<SampleOptions />
			<Samples
				table={lassoSelectTable === null || lassoSelectTable?.size === 0
					? $filteredTable
					: lassoSelectTable} />
		</div>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
	.paper {
		border: 1px #e0e0e0 solid;
	}
	#scatter-view {
		display: flex;
		justify-content: center;
		gap: 10px;
	}
	#pipeline-view {
		width: 400px;
		padding-left: 20px;
		overflow-y: scroll;
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
	#samples-view {
		margin-left: 10px;
	}
	h4 {
		font-weight: 500;
		color: rgba(0, 0, 0, 0.7);
		margin-bottom: 8px;
		margin-top: 25px;
	}
	#weak-labeler-pipeline {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	#pipeline-view::-webkit-scrollbar {
		display: none;
	}
</style>
