<script lang="ts">
	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import Scatter from "./scatterplot/LegendaryScatter.svelte";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import Button from "@smui/button";
	import TextField from "@smui/textfield";
	import * as pipeline from "./pipeline";
	import { filteredTable, model, settings, colorSpec, table } from "../stores";
	import { columnHash } from "../util";

	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import * as aq from "arquero";
	import Node from "./node/Node.svelte";

	// props
	export let scatterWidth = 800;

	export let scatterHeight = 550;

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
	let pipelineRepr: Pipeline.Node[] = [];

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

	const noReact = {
		resetScatter: () => (legendaryScatterPoints = []),
		setProjection: (projection) => (projection2D = projection),
		setPipeline: (pipeline) => (pipelineJSON = pipeline),
		setName: (name) => (regionLabelerName = name),
		setRepr: (repr) => (pipelineRepr = repr),
		setSelectedNode: (node) => (selectedNode = node),
	};

	const PIPELINE_ID = "nice";
	$: {
		if ($model && $table) {
			pipeline.pipelineJSON().then((d) => {
				noReact.setPipeline(d);
				noReact.setName(d.name);
				if (d.model !== $model) {
					noReact.setRepr([]);
					noReact.setProjection([]);
					noReact.resetScatter();
				}
			});
			pipeline.load({ model: $model, uid: PIPELINE_ID }).then((d) => {
				if (d !== null) {
					if (d.pipeline.length > 0) {
						noReact.setRepr(d.pipeline);
						const lastNode = d.pipeline[d.pipeline.length - 1];
						noReact.setProjection(lastNode.state.projection);
						noReact.setSelectedNode(lastNode);
					}
				}
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

	let selectedNode;
	let scatterObj;
	function resetSelection() {
		scatterObj.select([]);
	}
</script>

<div id="main">
	<MetadataBar shouldColor />

	<div>
		<div
			id="scatter-view"
			style:margin-top="10px"
			style:height="{scatterHeight}px">
			<div id="pipeline-view" class="paper" style:height="{scatterHeight}px">
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
									pipelineJSON = await pipeline.pipelineJSON();
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
								if (lassoSelectTable !== null) {
									tableIds = tableIds.intersect(lassoSelectTable);
								}
								const ids = tableIds.columnArray(
									columnHash($settings.idColumn)
								);
								const node = await pipeline.idFilter({ ids });
								projection2D = node.state.projection;
								pipelineJSON = await pipeline.pipelineJSON();
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
								pipelineJSON = await pipeline.pipelineJSON();
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
								pipelineJSON = await pipeline.pipelineJSON();
								pipelineRepr = [];
							}}>
							Reset</Button>
						<Button
							on:click={async () => {
								if (regionLabeler && regionPolygon.length > 0) {
									console.log(regionPolygon);
									console.log(regionLabelerName);
									console.log(selectedNode.id);
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
								pipelineJSON = await pipeline.pipelineJSON();
							}}>
							{regionLabeler
								? "Click Here to Confirm"
								: "Create Labeler"}</Button>
					</div>
				</div>
			</div>

			<div
				class="paper"
				style:width="{scatterWidth}px"
				style:height="{scatterHeight}px">
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
		padding-left: 20px;
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
		margin-bottom: 8px;
		margin-top: 25px;
	}

	#weak-labeler-pipeline {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
</style>
