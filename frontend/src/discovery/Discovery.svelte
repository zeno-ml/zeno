<script lang="ts">
	import type { LegendaryScatterPoint } from "./scatterplot/scatter";
	import type ColumnTable from "arquero/dist/types/table/column-table";

	import * as aq from "arquero";

	import Button from "@smui/button";
	import TextField from "@smui/textfield";

	import MetadataBar from "../metadata/MetadataPanel.svelte";
	import Scatter from "./scatterplot/LegendaryScatter.svelte";
	import Samples from "../general/Samples.svelte";
	import OptionsBar from "../general/OptionsBar.svelte";
	import PipelineLogo from "./pipeline/Logo.svelte";
	import PipelineNode from "./pipeline/Node.svelte";

	import * as pipeline from "./pipeline/";
	import {
		filteredTable,
		model,
		settings,
		colorSpec,
		table,
		metadataSelections,
		sliceSelections,
	} from "../stores";
	import { columnHash } from "../util/util";

	export let scatterWidth = 899;
	export let scatterHeight = 550;

	const PIPELINE_ID = "initial_pipeline";

	let projection2D: { proj: [number, number]; id: string }[] = [];
	let lassoSelectTable = null;
	let regionLabeler = false;
	let regionPolygon = [];
	let regionLabelerName = "name";
	let legendaryScatterPoints: LegendaryScatterPoint[] = [];
	let pipelineRepr: Pipeline.Node[] = [];
	let selectedNode;
	let scatterObj;
	let cpyFilteredTable = null;
	let cpyFilter: {
		slices?: string[];
		metadata?: Map<string, MetadataSelection>;
	} = {};

	$: metadataExists =
		$settings.metadataColumns.length > 0 || $filteredTable._names.length > 0;

	$: {
		if ($model && $table) {
			initPipeline($table, $model);
		}
	}

	$: {
		if (metadataExists && $colorSpec) {
			legendaryScatterPoints = projection2D.map((item) => {
				const { proj, id } = item;
				const [x, y] = proj;
				const opacity = 0.65;
				const color = $colorSpec.labels.find(
					(label) => label.id === id
				).colorIndex;
				const formatted = { x, y, opacity, id, color };
				return formatted;
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

	function filterIdsTable({
		table,
		idColumn,
		ids,
	}: {
		table: ColumnTable;
		idColumn: string;
		ids: string[];
	}) {
		let rows = [];
		for (const row of table) {
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

	function saveFilter() {
		return {
			slices: $sliceSelections.map((d) => d),
			metadata: new Map($metadataSelections),
		};
	}
	function loadFilter(cpy: {
		slices?: string[];
		metadata?: Map<string, MetadataSelection>;
	}) {
		sliceSelections.set(cpy.slices);
		metadataSelections.set(cpy.metadata);
	}

	async function goBackPipeline(nodeToReset?: Pipeline.Node) {
		await pipeline.reset({ upToId: nodeToReset.id });
		let newSubset = [];
		for (let i = 0; i < pipelineRepr.length; i++) {
			newSubset.push(pipelineRepr[i]);
			if (pipelineRepr[i].id === nodeToReset.id) {
				break;
			}
		}
		pipelineRepr = newSubset;
	}

	async function filterPipeline(ids) {
		const node = await pipeline.idFilter({ ids });
		node.filter = [];
		resetSelection();
		addToPipelineRepr(node);
		selectNode(node);
	}

	function addToPipelineRepr(node: Pipeline.Node) {
		pipelineRepr = [...pipelineRepr, node];
	}

	function selectNode(node: Pipeline.Node) {
		selectedNode = node;
		projection2D = node.state.projection;
	}

	function resetScatterPoints() {
		projection2D = [];
	}
</script>

<div id="main">
	<div id="metadata-bar-view">
		<MetadataBar shouldColor />
	</div>
	<div>
		<div id="scatter-view" style:height="{scatterHeight}px">
			<div id="pipeline-view" style:height="{scatterHeight}px">
				<div id="logo">
					<div style:height="20px" style:margin-top="14px">
						<PipelineLogo scale={0.25} />
					</div>
					<span id="pipeline-title">Pipeline</span>
				</div>
				<div>
					<Button
						title="Reset entire pipeline"
						style="color: lightgrey;"
						color={regionLabeler ? "secondary" : "primary"}
						on:click={async () => {
							await pipeline.reset();
							await pipeline.init({ model: $model, uid: PIPELINE_ID });
							resetScatterPoints();
							regionLabelerName = "default";
							pipelineRepr = [];
							metadataSelections.set(new Map());
							sliceSelections.set([]);
						}}>
						Reset All</Button>
					<div id="weak-labeler-pipeline">
						{#each pipelineRepr as node, i}
							<PipelineNode
								{node}
								maxCount={$table ? $table.size : 0}
								on:reset={async () => {
									await goBackPipeline(node);
									selectNode(node);
								}}
								on:select={() => {
									selectNode(node);
								}}
								selectedId={selectedNode.id}
								lastNode={i === pipelineRepr.length - 1} />
						{:else}
							<div>Empty pipeline</div>
						{/each}
					</div>
					<div
						style="display: flex; justify-content:left; gap: 10px; margin-top: 25px;">
						<Button
							title="Click to Filter Current Selection"
							variant="outlined"
							on:click={async () => {
								const tableIds = $filteredTable;
								const ids = tableIds.columnArray(
									columnHash($settings.idColumn)
								);
								await filterPipeline(ids);
							}}>
							Filter</Button>
						<Button
							variant="outlined"
							title="Click to Project with UMAP"
							on:click={async () => {
								const node = await pipeline.parametricUMAP();
								selectNode(node);
								addToPipelineRepr(node);
							}}>
							Project</Button>
					</div>
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
						{regionLabeler ? "Confirm" : "Create Labeler"}</Button>
					{#if regionLabeler}
						<div>
							<TextField bind:value={regionLabelerName} label={"Name"} />
						</div>
					{/if}
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
						if (cpyFilteredTable !== null) {
							filteredTable.set(cpyFilteredTable);
							loadFilter(cpyFilter);
						}
					}}
					on:select={({ detail }) => {
						const ids = detail.map(({ id }) => id);
						if (lassoSelectTable === null) {
							cpyFilter = saveFilter();
							cpyFilteredTable = $filteredTable;
						}
						if (ids.length > 0) {
							loadFilter({
								metadata: new Map(),
								slices: [],
							});
							lassoSelectTable = filterIdsTable({
								table: $table,
								idColumn: columnHash($settings.idColumn),
								ids,
							});
							filteredTable.set(lassoSelectTable);
						}
					}}
					bind:regionPolygon
					regionMode={regionLabeler} />
			</div>
		</div>
		<div class="horizontal-divider" style:margin-bottom="5px" />
		<!-- Instances view -->
		<div id="samples-view">
			<OptionsBar />
			<Samples table={$filteredTable} />
		</div>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
	#scatter-view {
		display: flex;
		/* justify-content: center; */
		gap: 10px;
	}
	#pipeline-view {
		width: 350px;
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
	#logo {
		display: flex;
		align-items: center;
		gap: 1ch;
		margin-bottom: 15px;
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
	#metadata-bar-view {
		border-right: 1px solid #e0e0e0;
	}
	#pipeline-title {
		font-weight: 400;
		color: rgba(0, 0, 0, 0.7);
		font-size: 25px;
		margin-bottom: 8px;
		margin-top: 25px;
	}
</style>
