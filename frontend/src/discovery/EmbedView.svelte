<script lang="ts">
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
	import { columnHash, updateFilteredTable } from "../util/util";
	import request from "../util/request";

	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { ScatterRowsWithIds } from "./scatter/scatter";

	type point2D = [number, number];
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

	let curProj: point2D[] = [];
	let initProj: point2D[] = [];
	let canProject = false;
	let isProjecting = false;

	lassoSelection.subscribe(() => updateFilteredTable($table));

	$: idToColorIndexMapping = new Map(
		$colorSpec.labels.map((d) => [d.id, d.colorIndex])
	);
	$: data = packageScatterData(curProj);
	$: colorRange = [...$colorSpec.colors];
	$: filtersApplied =
		$lassoSelection !== null ||
		$metadataSelections.size > 0 ||
		$sliceSelections.length > 0;
	// if we remove filters, just reset to our cached version
	$: if (!filtersApplied) {
		curProj = initProj;
	}
	// when I change the embeddings, I want to rerun the projection on those embeddings instead
	$: {
		if ($model && $status.doneProcessing) {
			initProjFromModel($model, $transform);
		}
	}

	async function initProjFromModel(model: string, transform = "") {
		// project if the embeddings exist and show the user a loader
		canProject = await embeddingsExist(model);
		if (canProject) {
			loadingIndicator(async () => {
				const projRequest = await project({
					model,
					transform,
				});
				if (projRequest !== undefined) {
					curProj = projRequest;
					initProj = [...curProj];
				}
			});
		} else {
			// otherwise, if the embeddings do not exist,
			// tell the user!
			canProject = false;
		}
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

	interface ProjectResponse {
		data: point2D[];
		model: string;
	}
	async function project({
		model,
		transform = "",
		ids,
	}: IProject): Promise<point2D[]> {
		const req = (await mirror.post({
			url: "project",
			payload: { model, transform, ids },
		})) as ProjectResponse;
		return req?.data;
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
			return table.columnArray(idColumnHash) as string[];
		} else {
			return [];
		}
	}

	/**
	 * Take a 2d array of points and return an object that my scatterplot can read
	 */
	function packageScatterData(curProj: point2D[]): ScatterRowsWithIds<string> {
		const ids = getIdsFromTable($filteredTable);
		const data = curProj.map((d, i) => {
			const id = ids[i];
			return {
				id,
				x: d[0],
				y: d[1],
				colorIndex: idToColorIndexMapping.get(id),
				opacity: 0.65,
			};
		}) as ScatterRowsWithIds<string>;
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
	function lassoSelect(e) {
		const selection = e.detail as ScatterRowsWithIds<string>[] | null;
		if (selection !== null) {
			const ids = selection.map((d) => d.id.toString());
			lassoSelection.set(ids);
		} else {
			// lassoSelection.set(null);
		}
	}
</script>

<div id="container">
	<div id="scatter-container">
		{#if canProject}
			<Scatter {data} {colorRange} on:lasso={lassoSelect} />
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
	<div id="overlay">
		<Button
			variant="outlined"
			disabled={!(filtersApplied && canProject)}
			on:click={async () => {
				loadingIndicator(async () => {
					const ids = curFilteredIds();
					curProj = await project({
						model: $model,
						ids,
						transform: $transform,
					});
				});
			}}>
			Rerun projection on selection
		</Button>
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
</style>
