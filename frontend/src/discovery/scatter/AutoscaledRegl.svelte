<script lang="ts">
	import ScaledRegl from "./ScaledRegl.svelte";
	import type { LegendaryScatterPoint } from "./scatter";
	import { extentXY } from "./scatter";
	import { schemeCategory10 } from "d3-scale-chromatic";

	export let width = 500;
	export let height = 500;
	export let colorRange = schemeCategory10 as string[];
	export let points: LegendaryScatterPoint[] = new Array(100_00)
		.fill(0)
		.map(() => ({
			x: Math.random() * 3,
			y: Math.random() * 5,
			color: Math.random(),
			opacity: Math.random(),
		}));
	$: extent = extentXY(
		points,
		(d) => d.x,
		(d) => d.y
	);
	const convertExtentToArray = (extent) => [extent.min, extent.max];
	$: xMinMax = convertExtentToArray(extent.xExtent);
	$: yMinMax = convertExtentToArray(extent.yExtent);
</script>

<ScaledRegl
	{width}
	{height}
	{points}
	{colorRange}
	{xMinMax}
	{yMinMax}
	on:create
	on:draw
	on:select
	on:deselect />

<style>
	/*  put stuff here */
</style>
