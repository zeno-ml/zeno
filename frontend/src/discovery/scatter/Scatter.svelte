<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import AutoScaleRegl from "./AutoScaleRegl.svelte";
	import type { ScatterRowsWithIds, ReglConfig, ColorRange } from "./scatter";

	const dispatch = createEventDispatcher();

	export let data: ScatterRowsWithIds<string> = [];
	export let width = 500;
	export let height = 500;
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};
</script>

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

<style>
</style>
