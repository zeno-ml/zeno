<script lang="ts">
	import Scatter from "./scatter/Scatter.svelte";
	import Button from "@smui/button";
	import UMAPParams from "./UMAPParams.svelte";

	import { colorSpec, filteredTable, settings } from "../stores";
	import { columnHash } from "../util/util";
	import { onMount } from "svelte";
	import { model } from "../stores";
	import request from "../util/request";

	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { ScatterRowsWithIds } from "./scatter/scatter";

	type point2D = [number, number];
	interface I2D {
		id: string;
		point: point2D;
	}
	interface IProject {
		model: string;
	}

	const endpoint = "api/mirror";
	const mirror = {
		post: request.generator.post(endpoint),
		get: request.generator.post(endpoint),
	};

	let minDistUMAP: number;
	let numNeighborsUMAP: number;
	let initialProj: I2D[] = [];

	$: data = initialProj.map((d, i) => {
		return {
			id: i.toString(),
			x: d[0],
			y: d[1],
			colorIndex: $colorSpec.labels[i].colorIndex,
			opacity: 0.65,
		};
	}) as ScatterRowsWithIds<string>;
	$: colorRange = [...$colorSpec.colors];

	onMount(async () => {
		const projRequest = await project({ model: $model });
		if (projRequest !== undefined) {
			initialProj = projRequest["data"];
		}
	});

	async function project(config: IProject): Promise<I2D[]> {
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
	<div>{initialProj.length}</div>
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
		on:click={() => {
			console.log("visualized pressed");
		}}>
		Visualize
	</Button>

	<UMAPParams bind:minDistUMAP bind:numNeighborsUMAP />
</div>
