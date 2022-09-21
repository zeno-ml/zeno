<script lang="ts">
	import Scatter from "./scatter/Scatter.svelte";
	import Button from "@smui/button";
	import UMAPParams from "./UMAPParams.svelte";

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
		get: request.generator.post(endpoint),
	};

	let minDistUMAP: number;
	let numNeighborsUMAP: number;
	let curProj: point2D[] = [];
	let initProj: point2D[] = [];

	$: idToColorIndexMapping = new Map(
		$colorSpec.labels.map((d) => [d.id, d.colorIndex])
	);
	$: currentIds = getIdsFromTable($filteredTable);
	$: data = curProj.map((d, i) => {
		const id = currentIds[i];
		return {
			id,
			x: d[0],
			y: d[1],
			colorIndex: idToColorIndexMapping.get(id),
			opacity: 0.65,
		};
	}) as ScatterRowsWithIds<string>;
	$: colorRange = [...$colorSpec.colors];
	$: {
		if ($sliceSelections.length === 0 && $metadataSelections.size === 0) {
			curProj = initProj;
		}
	}

	onMount(async () => {
		const projRequest = await initProject({
			model: $model,
		});
		if (projRequest !== undefined) {
			curProj = projRequest["data"];
			initProj = [...curProj];
		}
	});

	async function filterProject(config: IProject): Promise<point2D[]> {
		const req = await mirror.post({ url: "project", payload: config });
		return req;
	}

	async function initProject(config: IProject): Promise<point2D[]> {
		const req = await mirror.post({ url: "project", payload: config });
		return req;
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
</script>

<div>
	<div>Embedding View</div>
	<div>{curProj.length}</div>
	<Scatter
		{data}
		{colorRange}
		width={500}
		height={500}
		on:lasso={({ detail }) => {
			console.log(detail);
		}} />

	<!-- Whenever I'm not filtering, go back to default view -->
	<!-- whenever I'm filtering I can click visualize to reproject -->
	<Button
		variant="outlined"
		on:click={async () => {
			const ids = curFilteredIds();
			const projections = await filterProject({ model: $model, ids });
			curProj = projections["data"];
		}}>
		Visualize
	</Button>

	<UMAPParams bind:minDistUMAP bind:numNeighborsUMAP />
</div>
