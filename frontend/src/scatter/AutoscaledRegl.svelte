<script lang="ts">
	import ScaledRegl from "./ScaledRegl.svelte";
	import type { IPoints } from "./scatter";
	import { extentXY } from "./scatter";
	import * as d3 from "d3";

	export let width = 500;
	export let height = 500;
	export let colorRange = d3.schemeCategory10 as string[];
	export let points: IPoints[] = new Array(100_00).fill(0).map((_, i) => ({
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

<ScaledRegl {width} {height} {points} {colorRange} {xMinMax} {yMinMax} />

<style>
	/*  put stuff here */
</style>
