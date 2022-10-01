<script lang="ts">
	import { onMount } from "svelte";
	import Scatter from "./scatter/Scatter.svelte";
	import Button from "@smui/button";
	import { Shadow as LoadingAnimation } from "svelte-loading-spinners";

	import {
		colorSpec,
		filteredTable,
		settings,
		sliceSelections,
		metadataSelections,
		table,
		lassoSelection,
		model,
		status,
		transform,
	} from "../stores";
	import { columnHash, enforce, updateFilteredTable } from "../util/util";
	import request from "../util/request";

	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type {
		ReglScatterplot,
		ScatterRow,
		ScatterRowsFormat,
	} from "./scatter/scatter";
	import { Snapshot } from "./startingPoints/snapshot";

	type Point2D = [number, number];
	interface IProject {
		model: string;
		transform?: string;
		ids?: string[];
	}

	const endpoint = "api/mirror";
	const mirror = {
		post: request.generator.post(endpoint),
		get: request.generator.get(endpoint),
	};

	let snapshots = new Map<string, Snapshot>();
	let startingPoint: Snapshot = new Snapshot(); // only within these points
	let reprojection: Snapshot = new Snapshot(); // reproject and filter

	let curProj: Point2D[] = [];
	let initProj: Point2D[] = [];
	let canProject = false;
	let isProjecting = false;
	let reglScatterplot: ReglScatterplot;

	$: {
		if (mounted && $table.size > 0) {
			initStartingAll($model, $transform);
		}
	}

	async function initStartingAll(model: string, transform = "") {
		canProject = await embeddingsExist(model);
		if (canProject) {
			loadingIndicator(async () => {
				startingPoint = new Snapshot({
					name: `ALL`,
					ids: getIdsFromTable($table),
				});

				// set the starting point with the initial projection
				startingPoint = await startingPoint.deriveProjection(model, transform);
				console.log(startingPoint);

				// at the start the reprojection can be the same as the
				// starting point
				reprojection = startingPoint.copy();
				reprojection.name = "reproject";

				// globally store the options
				snapshots.set(startingPoint.name, startingPoint);
				snapshots.set(reprojection.name, reprojection);
			});
		} else {
			canProject = false;
		}
	}

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	lassoSelection.subscribe(() => updateFilteredTable($table));

	// // SCATTER PLOTTING AND COLORING DATA
	$: idToColorIndexMapping = new Map<string, number>(
		$colorSpec.labels.map((d: ScatterRow) => [d.id, d.colorIndex])
	);
	$: colorRange = [...$colorSpec.colors];
	$: startingPointScatter = snapshotToScatter(
		startingPoint,
		idToColorIndexMapping
	);
	$: opaqueStartingPointScatter = makeFilteredOpaque(
		startingPointScatter,
		$filteredTable
	);
	$: reprojectionScatter = snapshotToScatter(
		reprojection,
		idToColorIndexMapping
	);
	$: opaqueReprojectionScatter = makeFilteredOpaque(
		reprojectionScatter,
		$filteredTable
	);
	$: console.log(opaqueReprojectionScatter);
	$: filtersApplied =
		$lassoSelection.length > 0 ||
		$metadataSelections.size > 0 ||
		$sliceSelections.length > 0;

	interface ExistsResponse {
		exists: boolean;
		model: string;
	}
	async function embeddingsExist(model: string) {
		const embeddingsCheck = (await mirror.get({
			url: `exists/${model}`,
		})) as ExistsResponse;
		return embeddingsCheck?.exists;
	}

	/**
	 * Get the column for id as an array of strings from
	 * the arquero table.
	 */
	function curFilteredIds(): string[] {
		return getIdsFromTable($filteredTable);
	}
	function getIdsFromTable(table: ColumnTable) {
		const idColumnHash = columnHash($settings.idColumn);
		const idColumnExists = table.size > 0 && table.column;
		if (idColumnExists) {
			return table.array(idColumnHash) as string[];
		} else {
			return [];
		}
	}

	/**
	 * Take a 2d array of points and return an object that my scatterplot can read
	 */
	function snapshotToScatter(
		snapshot: Snapshot,
		idToColor: Map<string, number>
	): ScatterRowsFormat {
		enforce({ rule: idToColor.size > 0, name: "color mappings exist" });

		const ids = snapshot.ids;
		const data = snapshot.start2D.map((d, i) => {
			const id = ids[i];
			return {
				id,
				x: d[0],
				y: d[1],
				colorIndex: idToColor.get(id),
				opacity: 1.0,
			};
		}) as ScatterRowsFormat;
		return data;
	}

	/**
	 * wrapper that connects to the loading bar thingy
	 */
	async function loadingIndicator(func: () => Promise<void>) {
		// throw a ton of awaits and hope something happens
		isProjecting = true;
		await func();
		isProjecting = false;
	}

	/**
	 * select the ids out of the lasso select from the scatterplot
	 * and store globally
	 */
	function lassoSelect(e: CustomEvent<ScatterRowsFormat>) {
		const selection = e.detail;
		const ids = selection.map((d) => d.id?.toString());
		lassoSelection.set(ids);
	}

	/**
	 * Update the opacities based on if the data is
	 * currently being filtered in or out
	 */
	function makeFilteredOpaque(
		scatterData: ScatterRowsFormat,
		filteredTable: ColumnTable,
		{ reducedOpacity = 0.1, fullOpacity = 0.75 } = {}
	) {
		// make the points no longer in the table less opacity
		const curFilterIds = getIdsFromTable(filteredTable);
		const containsFiltered = new Map(curFilterIds.map((d) => [d, true]));

		// go over the points and update
		scatterData.forEach((d) => {
			if (containsFiltered.get(d.id)) {
				d.opacity = fullOpacity;
			} else {
				d.opacity = reducedOpacity;
			}
		});

		return scatterData;
	}
</script>

<div id="container">
	<div id="scatter-container">
		{#if canProject}
			<div id="global-view">
				<fieldset>
					<legend><h3>All</h3></legend>
					<div class="no-interact">
						<Scatter
							width={250}
							height={250}
							data={opaqueStartingPointScatter}
							config={{ pointSize: 2 }}
							{colorRange} />
					</div>
				</fieldset>
				<div>
					<div>
						<Button
							variant="outlined"
							disabled={!canProject}
							on:click={() => {
								metadataSelections.set(new Map());
								sliceSelections.set([]);
								lassoSelection.set([]);
								reglScatterplot.deselect();
								reprojection = startingPoint.copy();
							}}>
							Reset Back to All
						</Button>
					</div>
					<div />
					<!-- <div>
						<Button
							variant="outlined"
							disabled={$lassoSelection.length <= 0}
							on:click={() => {
								loadingIndicator(async () => {
									if ($filteredTable.size === initProj.length) {
										curProj = initProj;
									} else {
										const ids = curFilteredIds();
										curProj = await project({
											model: $model,
											ids,
											transform: $transform,
										});
									}
								});
							}}>Reproject on Lasso</Button>
					</div> -->
				</div>
			</div>
			<div id="main-view">
				<fieldset>
					<legend><h3>Filtered and Reprojection</h3></legend>
					<Scatter
						width={800}
						data={opaqueReprojectionScatter}
						config={{ pointSize: 4 }}
						{colorRange}
						on:lasso={lassoSelect}
						on:mount={(e) => {
							reglScatterplot = e.detail;
						}} />
					<Button
						variant="outlined"
						on:click={async () => {
							loadingIndicator(async () => {
								// from the starting point
								const ids = getIdsFromTable($filteredTable);
								// snapshot the filtered and projected space and reassign
								reprojection = await startingPoint
									.deriveFilter(ids)
									.deriveProjection($model, $transform, "reprojection");
							});
						}}>
						Filter and Reproject from &nbsp<i><b>Selected</b></i>
					</Button>
				</fieldset>
			</div>
		{:else if !$status.doneProcessing}
			<div id="loading-content">
				<h3 class="embed-status">Awaiting processing.</h3>
			</div>
		{:else}
			<div id="loading-content">
				<h3 class="embed-status">No embeddings for this model.</h3>
			</div>
		{/if}
		{#if isProjecting}
			<div id="loading-container">
				<div id="loading-indicator">
					<div id="loading-content">
						<h3>Running Projection</h3>
						<div>
							<LoadingAnimation size={50} color="black" />
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	#container {
		position: relative;
		min-height: 200px;
	}
	.embed-status {
		margin-top: 100px;
	}
	#overlay {
		backdrop-filter: blur(5px);
		position: absolute;
		top: 10px;
		left: 10px;
	}
	#scatter-container {
		position: relative;
		display: flex;
		gap: 15px;
	}
	#loading-container {
		position: absolute;
		backdrop-filter: blur(5px);
		transition: backdrop-filter 1s ease-in-out;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	#loading-indicator {
		position: absolute;
		left: 30%;
		top: 30%;
	}
	#loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}
	#main-view {
		outline: 1px solid lightgrey;
	}
	#global-view {
		outline: 1px solid lightgrey;
	}
	h3 {
		margin: 0;
		padding: 0;
	}
	fieldset {
		border-radius: 5px;
	}
	fieldset legend {
		padding: 0 10px;
	}
	.no-interact {
		pointer-events: none;
		display: inline;
	}
</style>
