<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import AutoScaleRegl from "./AutoScaleRegl.svelte";
	import type { ScatterRowsWithIds, ReglConfig, ColorRange } from "./scatter";

	const dispatch = createEventDispatcher();

	export let data: ScatterRowsWithIds<string> = [];
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};

	let innerWidth, innerHeight;
	let width;
	let height = 500;
	$: width = innerWidth - 470;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if width && height}
	<AutoScaleRegl
		{data}
		downScale="maxDim"
		on:lassoIndex={({ detail }) => {
			if (detail !== null) {
				const indexToInstanceMapping = detail.map((index) => data[index]);
				dispatch("lasso", indexToInstanceMapping);
			} else {
				dispatch("lasso", null);
			}
		}}
		{colorRange}
		{config}
		{width}
		{height} />
{/if}

<style>
</style>
