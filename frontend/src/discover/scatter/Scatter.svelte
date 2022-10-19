<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	import AutoScaleRegl from "./AutoScaleRegl.svelte";
	import type { ScatterRowsFormat, ReglConfig, ColorRange } from "./scatter";

	const dispatch = createEventDispatcher<{ lasso: ScatterRowsFormat }>();

	export let data: ScatterRowsFormat = [];
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};
	export let inferDimensions = false;
	export let width = 500;
	export let height = 500;

	let innerWidth: number, innerHeight: number;
	let calculatedWidth: number = width;
	let calculatedHeight: number = height;

	$: {
		if (inferDimensions && mounted) {
			calculatedWidth = innerWidth ? innerWidth - 470 : width;
		}
	}

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

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
		downScale="maxDim"
		on:lassoIndex={lassoPoints}
		on:mount
		{colorRange}
		{config}
		width={inferDimensions ? calculatedWidth : width}
		height={inferDimensions ? calculatedHeight : height} />
{/if}

<style>
</style>
