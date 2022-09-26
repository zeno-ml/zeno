<script lang="ts">
	import Scatter from "./scatter/Scatter.svelte";
	import Button from "@smui/button";

	import {
		colorSpec,
		filteredTable,
		settings,
		sliceSelections,
		metadataSelections,
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

	$: idToColorIndexMapping = new Map(
		$colorSpec.labels.map((d) => [d.id, d.colorIndex])
	);
	$: currentIds = getIdsFromTable($filteredTable);
	$: data = packageScatterData(curProj);
	$: colorRange = [...$colorSpec.colors];
	$: {
		if ($sliceSelections.length === 0 && $metadataSelections.size === 0) {
			curProj = initProj;
		}
	}

	let canProject = false;
	let isProjecting = false;
	onMount(async () => {
		// project if the embeddings exist and show the user a loader
		canProject = await embeddingsExist($model);
		if (canProject) {
			isProjecting = await true;
			const projRequest = await initProject({
				model: $model,
			});
			if (projRequest !== undefined) {
				curProj = projRequest;
				initProj = [...curProj];
			}
			isProjecting = await false;
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
		const data = curProj.map((d, i) => {
			const id = currentIds[i];
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
</script>

<div>
	{#if canProject}
		<Scatter
			{data}
			{colorRange}
			width={500}
			height={500}
			on:lasso={({ detail }) => {
				console.log(detail);
			}} />

		{#if isProjecting}
			<div>Loading...</div>
		{/if}

		{@const filterApplied =
			$metadataSelections.size > 0 || $sliceSelections.length > 0}
		{#if filterApplied}
			<Button
				variant="outlined"
				on:click={async () => {
					const ids = curFilteredIds();
					curProj = await filterProject({ model: $model, ids });
				}}>
				Visualize
			</Button>
		{/if}
	{:else}
		<div>Embeddings do not exist for this model.</div>
	{/if}
</div>
