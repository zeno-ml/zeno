<script lang="ts">
	import { onMount } from "svelte";
	import Scatter from "./scatter/Scatter.svelte";
	import Select, { Option } from "@smui/select";
	import Button from "@smui/button";
	import { Shadow as LoadingAnimation } from "svelte-loading-spinners";
	import { scaleLinear as scaler } from "d3-scale";

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
		startingPointIds,
	} from "../stores";
	import { columnHash, enforce, updateFilteredTable } from "../util/util";
	import request from "../util/request";

	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type {
		ReglScatterplot,
		ScatterRow,
		ScatterRowsFormat,
	} from "./scatter/scatter";
	import SnapshotButtons from "./startingPoints/SnapshotButtons.svelte";
	import { Snapshot } from "./startingPoints/snapshot";
	import Textfield from "@smui/textfield";

	interface ExistsResponse {
		exists: boolean;
		model: string;
	}
	interface StartingPoints {
		my: Snapshot[];
		recommended: Snapshot[];
	}

	const endpoint = "api/mirror";
	const mirror = {
		post: request.generator.post(endpoint),
		get: request.generator.get(endpoint),
	};

	let availableStartingPoints: StartingPoints = {
		my: [],
		recommended: [],
	};
	let startingPoint: Snapshot = new Snapshot(); // only within these points
	let currentState: Snapshot = new Snapshot(); // reproject and filter

	let canProject = false;
	let isProjecting = false;
	let reglScatterplot: ReglScatterplot;
	let reglPreviewScatterplot: ReglScatterplot;
	let perplexity = "30";
	let mounted = false;

	/* interpolates between point sizes based on num points and observed */
	$: adjustPointSizes = adjustPointSizesGenerator(
		reglScatterplot,
		{ numPoints: 5_000, pointSize: 3 },
		{ numPoints: 100, pointSize: 10 }
	);
	$: adjustPointSizesPreview = adjustPointSizesGenerator(
		reglPreviewScatterplot,
		{ numPoints: 5_000, pointSize: 1 },
		{ numPoints: 100, pointSize: 4 }
	);

	lassoSelection.subscribe(() => updateFilteredTable($table));
	$: {
		if (mounted && $table.size > 0) {
			initSnapshots($model, $transform);
		}
	}
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
		currentState,
		idToColorIndexMapping
	);
	$: opaqueReprojectionScatter = makeFilteredOpaque(
		reprojectionScatter,
		$filteredTable
	);
	$: filtersApplied =
		$metadataSelections.size > 0 || $sliceSelections.length > 0;

	$: if (reglScatterplot && currentState.ids && startingPoint.ids) {
		adjustPointSizes(currentState.ids.length);
		adjustPointSizesPreview(startingPoint.ids.length);
	}

	onMount(async () => {
		mounted = true;
	});

	async function generateSnapshots(all: Snapshot) {
		const generatedSlices = await mirror.get({ url: "sdm" });
		const snapshots = sliceDiscoveryToSnapshot(generatedSlices["data"]);

		// initialize each snapshot with a subset of the projection
		snapshots.forEach((sh) => {
			const subset = all.filter(sh.ids);
			sh.ids = subset.ids;
			sh.start2D = subset.start2D;
		});
		return snapshots;
	}
	function sliceDiscoveryToSnapshot(slices: { ids: string[]; name: string }[]) {
		const sliceSnapshots = slices.map((slice) => {
			return new Snapshot({ name: `🍕 ${slice.name}`, ids: slice.ids });
		});
		return sliceSnapshots as Snapshot[];
	}

	function nameExistsInAvailableStartingPoints(name: string) {
		if (name.length === 0) {
			return true;
		}
		for (const snapshots of Object.values(availableStartingPoints)) {
			for (const snapshot of snapshots) {
				if (snapshot.name.toLowerCase() === name.toLowerCase()) {
					return true;
				}
			}
		}
		return false;
	}

	async function initSnapshots(model: string, transform = "") {
		canProject = await embeddingsExist(model);
		if (canProject) {
			loadingIndicator(async () => {
				startingPoint = new Snapshot({
					name: `🌎 ALL`,
				});

				// set the starting point with the initial projection
				startingPoint = await startingPoint.project(model, transform);
				startingPoint.ids = getIdsFromTable($table);
				selectStartingPoint(startingPoint);

				// see if we have any cached pregrenered slices
				const generated = await generateSnapshots(startingPoint);

				// show the available options for starting points
				availableStartingPoints.recommended = [
					startingPoint.copy(),
					...generated,
				];
			});
		} else {
			canProject = false;
		}
	}

	/**
	 * Takes the filter and reprojects with tsne
	 * Note that this updates currentSnapshot
	 */
	async function filterReproject() {
		if (canProject) {
			loadingIndicator(async () => {
				const globalFilter = getIdsFromTable($filteredTable);
				currentState = await startingPoint
					.filter(globalFilter)
					.project($model, $transform, Number(perplexity));
				currentState.name = "🏁 reproject";
			});
		}
	}

	/**
	 * Take the current snapshot (scatter state)
	 * and save to available starting points
	 */
	function lassoAddNewStartingPoint() {
		const lassoedSnapshot = currentState.filter($lassoSelection);
		availableStartingPoints.my.push(lassoedSnapshot);
		availableStartingPoints = availableStartingPoints; // so svelte reacts on reassignment
		selectStartingPoint(lassoedSnapshot); // then select
	}

	function recenterScatter() {
		const fitScatterCameraAtOrigin = new Float32Array([
			1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
		]);
		reglScatterplot?.set({
			cameraView: fitScatterCameraAtOrigin,
		});
	}

	/**
	 * Overrides the current starting point
	 * and simply copies the currentSnapshot as the start
	 * Filters and everything are cleared
	 */
	function selectStartingPoint(snapshot: Snapshot) {
		recenterScatter();
		startingPointIds.set(snapshot.ids); // global store
		startingPoint = snapshot.copy();
		currentState = startingPoint.copy();
		currentState.name = "🏁 reproject";
		clearAllFilters();
	}

	/**
	 * Returns a functions that interpolates between min and max point sizes based
	 * in input numPoints
	 * for numPoints under the min or over the max, will default to the specified pointSizes
	 */
	function adjustPointSizesGenerator(
		scatterRef: ReglScatterplot,
		min: { numPoints: number; pointSize: number },
		max: { numPoints: number; pointSize: number }
	) {
		if (scatterRef === undefined) {
			return () => 1;
		}
		const numPointsToPointSize = scaler()
			.domain([min.numPoints, max.numPoints])
			.range([min.pointSize, max.pointSize]);

		return (numPoints: number) => {
			// only do values between the min and max not under or above
			let newSize = numPointsToPointSize(numPoints);
			if (newSize < min.pointSize) {
				newSize = min.pointSize;
			}
			if (newSize > max.pointSize) {
				newSize = max.pointSize;
			}
			return scatterRef.set({ pointSize: newSize });
		};
	}

	function clearAllFilters() {
		metadataSelections.set(new Map());
		sliceSelections.set([]);
		lassoSelection.set([]);
		reglScatterplot.deselect();
	}

	async function embeddingsExist(model: string) {
		const embeddingsCheck = (await mirror.get({
			url: `exists/${model}`,
		})) as ExistsResponse;
		return embeddingsCheck?.exists;
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

	function cancelLasso() {
		reglScatterplot?.deselect();
		lassoSelection.set([]);
	}
</script>

<div id="container">
	<div id="scatter-container">
		{#if canProject}
			<div id="main-view">
				<Scatter
					inferDimensions
					height={620}
					data={opaqueReprojectionScatter}
					config={{ pointSize: 3 }}
					{colorRange}
					on:lasso={lassoSelect}
					on:mount={(e) => {
						reglScatterplot = e.detail;
					}} />
				{#if $lassoSelection.length > 0}
					{@const nameValid = nameExistsInAvailableStartingPoints(
						currentState.name
					)}
					<div id="add-snapshot" class="glass">
						<Textfield
							bind:value={currentState.name}
							label="Starting Point"
							invalid={nameValid} />
						<Button
							on:click={lassoAddNewStartingPoint}
							variant="outlined"
							disabled={nameValid}
							>Save
						</Button>
						<Button on:click={cancelLasso}>Cancel (Back to Filtering)</Button>
					</div>
				{/if}

				{#if $lassoSelection.length === 0}
					<div id="apply-filter" class="glass">
						<Select
							label="Perplexity"
							style="width: 120px;"
							bind:value={perplexity}>
							<Option value={"5"}>5</Option>
							<Option value={"30"}>30</Option>
							<Option value={"50"}>50</Option>
							<Option value={"100"}>100</Option>
						</Select>
						<Button variant="outlined" on:click={filterReproject}>
							{!filtersApplied
								? "Reproject (hint: you can add a filter)"
								: "Reproject with Filter"}
						</Button>
						{#if filtersApplied}
							<Button
								on:click={() => {
									clearAllFilters();
									selectStartingPoint(startingPoint);
								}}>Reset to starting point</Button>
						{/if}
					</div>
				{/if}
			</div>
			<div id="global-view" class="glass">
				<h2>Starting Points</h2>
				<div id="starting-list">
					{#each Object.values(availableStartingPoints) as snapshots}
						<SnapshotButtons
							{snapshots}
							{startingPoint}
							on:click={({ detail }) => {
								selectStartingPoint(detail);
							}}>
							<Scatter
								width={200}
								height={150}
								data={opaqueStartingPointScatter}
								config={{ pointSize: 1 }}
								on:mount={(e) => {
									reglPreviewScatterplot = e.detail;
								}}
								{colorRange} />
						</SnapshotButtons>
					{/each}
				</div>
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
		height: 610px;
		box-sizing: border-box;
	}
	.embed-status {
		margin-top: 100px;
	}
	#scatter-container {
		position: relative;
		display: flex;
		gap: 15px;
		height: 100%;
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
		position: relative;
		/* outline: 1px solid lightgrey; */
	}
	#global-view {
		min-width: 300px;
		width: 300px;
		padding-left: 30px;
		height: 500px;
		left: 10px;
		top: 10px;
		position: absolute;
		overflow-y: scroll;
		overflow-x: hidden;
	}
	#global-view::-webkit-scrollbar {
		width: 0px;
	}
	#global-view::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
	#global-view::-webkit-scrollbar-thumb {
		background: #888;
	}
	#global-view::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
	h2 {
		color: rgba(0, 0, 0, 0.7);
		font-size: 18px;
		font-weight: 500;
		margin-bottom: 15px;
		padding: 0;
	}
	h3 {
		font-weight: 400;
		margin: 10px;
		padding: 0;
		color: rgba(0, 0, 0, 0.7);
	}
	.glass {
		backdrop-filter: blur(5px);
		box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.069);
		background-color: rgba(255, 255, 255, 0.776);
		border-radius: 5px;
	}
	#add-snapshot {
		position: absolute;
		top: 10px;
		left: calc(350px + 10px);
		padding: 10px;
	}
	#apply-filter {
		z-index: 999;
		position: absolute;
		bottom: 10px;
		left: 10px;
		padding: 10px;
	}
	#starting-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
