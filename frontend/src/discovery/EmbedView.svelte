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
		lassoSelection,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { onMount } from "svelte";
	import { model } from "../stores";
	import request from "../util/request";

	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { ScatterRowsWithIds } from "./scatter/scatter";

	type point2D = [number, number];
	interface IProject {
		model: string;
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

	$: idToColorIndexMapping = new Map(
		$colorSpec.labels.map((d) => [d.id, d.colorIndex])
	);
	$: data = packageScatterData(curProj);
	$: colorRange = [...$colorSpec.colors];
	$: filtersApplied =
		$metadataSelections.size > 0 || $sliceSelections.length > 0;
	// if we remove filters, just reset to our cached version
	$: if (!filtersApplied) {
		curProj = initProj;
	}

	onMount(async () => {
		// project if the embeddings exist and show the user a loader
		canProject = await embeddingsExist($model);
		if (canProject) {
			loadingIndicator(async () => {
				const projRequest = await initProject({
					model: $model,
				});
				if (projRequest !== undefined) {
					curProj = projRequest;
					initProj = [...curProj];
				}
			});
		} else {
			// otherwise, if the embeddings do not exist,
			// tell the user!
		}
	});

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
	async function filterProject(config: IProject): Promise<point2D[]> {
		const req = (await mirror.post({
			url: "project",
			payload: config,
		})) as ProjectResponse;
		return req?.data;
	}
	async function initProject(config: IProject): Promise<point2D[]> {
		const req = (await mirror.post({
			url: "project",
			payload: config,
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
			lassoSelection.set(null);
		}
	}
</script>

<div id="container">
	<div id="scatter-container">
		{#if canProject}
			<Scatter {data} {colorRange} on:lasso={lassoSelect} />
		{:else}
			<div>Embeddings do not exist for this model.</div>
		{/if}
		{#if isProjecting}
			<div id="loading-container">
				<div id="loading-indicator">
					<div id="loading-content">
						<h1>Running Projection</h1>
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
					curProj = await filterProject({ model: $model, ids });
				});
			}}>
			Rerun projection on selection
		</Button>
	</div>
</div>

<style>
	#container {
		position: relative;
	}
	#overlay {
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
