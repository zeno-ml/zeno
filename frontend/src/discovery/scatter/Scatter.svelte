<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import AutoScaleRegl from "./AutoScaleRegl.svelte";
	import type { ScatterRowsFormat, ReglConfig, ColorRange } from "./scatter";

	const dispatch = createEventDispatcher<{ lasso: ScatterRowsFormat }>();

	export let data: ScatterRowsFormat = [];
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};
	export let resetSelection = true;

	let innerWidth: number, innerHeight: number;
	export let width = 500;
	export let height = 500;
	// $: width = innerWidth - 470;

	function lassoPoints(e: CustomEvent<number[]>) {
		const selection = e.detail;
		const indexToInstanceMapping = selection.map((index) => data[index]);
		dispatch("lasso", indexToInstanceMapping);
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if width && height}
	<AutoScaleRegl
		{data}
		{resetSelection}
		downScale="maxDim"
		on:lassoIndex={lassoPoints}
		on:mount
		{colorRange}
		{config}
		{width}
		{height} />
{/if}

<style>
</style>
