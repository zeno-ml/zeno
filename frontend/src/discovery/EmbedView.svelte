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
	import { Snapshot } from "./startingPoints/snapshot";
	import Textfield from "@smui/textfield";

	const endpoint = "api/mirror";
	const mirror = {
		post: request.generator.post(endpoint),
		get: request.generator.get(endpoint),
	};

	interface StartingPoints {
		my: Snapshot[];
		recommended: Snapshot[];
	}
	let availableStartingPoints: StartingPoints = {
		recommended: [],
		my: [],
	};
	let startingPoint: Snapshot = new Snapshot(); // only within these points
	let currentState: Snapshot = new Snapshot(); // reproject and filter

	let canProject = false;
	let isProjecting = false;
	let reglScatterplot: ReglScatterplot;

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

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

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
					name: `ALL`,
					ids: getIdsFromTable($table),
				});

				// set the starting point with the initial projection
				startingPoint = await startingPoint.project(model, transform);
				selectStartingPoint(startingPoint);

				// show the available options for starting points
				availableStartingPoints.recommended = [startingPoint.copy()];
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
					.project($model, $transform, "reproject");
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

	/**
	 * Overrides the current starting point
	 * and simply copies the currentSnapshot as the start
	 * Filters and everything are cleared
	 */
	function selectStartingPoint(snapshot: Snapshot) {
		startingPointIds.set(snapshot.ids); // global store
		startingPoint = snapshot.copy();
		currentState = startingPoint.copy();
		currentState.name = "reproject";
		clearAllFilters();
	}

	function clearAllFilters() {
		metadataSelections.set(new Map());
		sliceSelections.set([]);
		lassoSelection.set([]);
		reglScatterplot.deselect();
	}

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
			<div id="global-view">
				<h2>Starting Points</h2>
				<div class="starting-list">
					{#each Object.entries(availableStartingPoints) as asp}
						{@const [category, snapshots] = asp}
						<h3 style:text-transform="capitalize">{category}</h3>
						{#each snapshots as snapshot}
							{@const isCurStartingPoint = snapshot.name === startingPoint.name}
							<div
								class="starting-container"
								class:starting-open={isCurStartingPoint}
								class:starting-selected={isCurStartingPoint}
								on:click={() => selectStartingPoint(snapshot)}>
								<div class="starting-label">
									{snapshot.name}
								</div>
								{#if isCurStartingPoint}
									<div class="starting-preview no-interact">
										<Scatter
											width={200}
											height={150}
											data={opaqueStartingPointScatter}
											config={{ pointSize: 2 }}
											{colorRange} />
									</div>
								{/if}
							</div>
						{:else}
							EMPTY
						{/each}
					{/each}
				</div>
			</div>
			<div id="main-view">
				<Scatter
					width={700}
					height={600}
					data={opaqueReprojectionScatter}
					config={{ pointSize: 5 }}
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
						<Button on:click={cancelLasso}>Cancel</Button>
					</div>
				{/if}

				{#if filtersApplied && $lassoSelection.length === 0}
					<div id="apply-filter" class="glass">
						<Button variant="outlined" on:click={filterReproject}
							>Visualize Filter</Button>
					</div>
				{/if}
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
		height: 600px;
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
		outline: 1px solid lightgrey;
		min-width: 300px;
		width: 300px;
		padding-left: 30px;
	}
	h2 {
		font-size: 20px;
		font-weight: 500;
		margin: 5px 0;
		padding: 0;
	}
	h3 {
		font-weight: 400;
		margin: 0;
		padding: 0;
		color: lightgrey;
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
	.starting-label {
		height: 100%;
	}
	.starting-container {
		position: relative;
		width: 250px;
		height: 30px;
		cursor: pointer;
		background-color: rgba(0, 0, 0, 0.025);
		border-radius: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		transition: height 1s ease-in-out;
		overflow: hidden;
	}
	.starting-container:hover {
		background-color: #71319a10;
	}
	.starting-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	.starting-open {
		height: 150px;
	}
	.starting-selected {
		border: #71319a 2px solid;
		color: #71319a;
	}
	.glass {
		backdrop-filter: blur(5px);
		box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.069);
		border-radius: 5px;
	}
	#add-snapshot {
		position: absolute;
		bottom: 10px;
		left: 10px;
		padding: 10px;
	}
	#apply-filter {
		position: absolute;
		bottom: 10px;
		left: 10px;
		padding: 10px;
	}
</style>
