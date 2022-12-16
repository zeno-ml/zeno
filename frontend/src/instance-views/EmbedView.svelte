<script lang="ts">
	import ReglScatterplot from "./scatter/ReglScatterplot.svelte";

	import { checkEmbedExists, projectEmbedInto2D } from "../api";
	import { model, transform } from "../stores";
	import { onMount } from "svelte";
	import type { ScatterColumnsFormat } from "./scatter/types";

	export let currentResult;
	export let table;
	export let viewFunction;
	export let viewOptions = {};

	let height = 800;
	let width = 1000;
	let embedExists = false;
	let points: Points2D;

	onMount(async () => {
		embedExists = await checkEmbedExists($model, $transform);
		points = (await projectEmbedInto2D($model, $transform)) as Points2D;
	});
</script>

{#if embedExists}
	<div>Embed View</div>
	<div id="container">
		{#if points}
			<ReglScatterplot {width} {height} data={points} />
		{/if}
	</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
</style>
