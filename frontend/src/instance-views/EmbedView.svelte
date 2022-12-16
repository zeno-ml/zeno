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

	let height = window.innerHeight;
	let width = window.innerWidth;
	let embedExists = false;
	let points: ScatterColumnsFormat = {
		x: [],
		y: [],
		ids: [],
	};

	onMount(async () => {
		embedExists = await checkEmbedExists($model, $transform);
		points = (await projectEmbedInto2D(
			$model,
			$transform
		)) as ScatterColumnsFormat;
	});
</script>

<svelte:window
	on:resize={() => {
		width = window.innerWidth;
		height = window.innerHeight;
	}} />

{#if embedExists}
	<div>Embed View</div>
	<div id="container">
		<ReglScatterplot {width} {height} data={points} />
	</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
</style>
