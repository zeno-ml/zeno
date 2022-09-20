<script lang="ts">
	import Scatter from "./scatter/Scatter.svelte";
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
</div>
