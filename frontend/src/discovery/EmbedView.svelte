<script lang="ts">
	import Scatter from "./scatter/Scatter.svelte";
	import Button from "@smui/button";
	import { colorSpec } from "../stores";
	import type { ScatterRowsWithIds } from "./scatter/scatter";
	import { onMount } from "svelte";
	import { model } from "../stores";
	import request from "../util/request";

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

	let initialProj: I2D[] = [];

	const defaultParams = {
		numNeighborsUMAP: 15,
		minDistUMAP: 0.1,
	};
	let { minDistUMAP, numNeighborsUMAP } = defaultParams;

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

	<!-- UMAP parameter customization for later -->
	<div>
		<h3>UMAP Parameters</h3>
		<div>
			<label for="min-dist">Min Dist</label>
			<input
				id="min-dist"
				bind:value={minDistUMAP}
				type="range"
				step="0.1"
				min="0.1"
				max="3.0" />
			{minDistUMAP}
		</div>

		<div>
			<label for="nn">Num Neighbors</label>
			<input
				id="nn"
				type="range"
				bind:value={numNeighborsUMAP}
				step="10"
				min="5"
				max="100" />
			{numNeighborsUMAP}
		</div>
	</div>
</div>
