<script lang="ts">
	import ScaledTrackerRegl from "./ScaledTrackerRegl.svelte";
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
	function extentRange(extent: { min: number; max: number }) {
		return extent.max - extent.min;
	}

	function fitSmallerExtent(
		largerRange: number,
		smallerExtent: { min: number; max: number }
	) {
		const smallerMidpoint = (smallerExtent.min + smallerExtent.max) / 2;
		const halfRange = largerRange / 2;
		return {
			min: smallerMidpoint - halfRange,
			max: smallerMidpoint + halfRange,
		};
	}
	function adjustExtentToFit(extent) {
		let newExtent = { xExtent: null, yExtent: null };
		const xRange = extentRange(extent.xExtent);
		const yRange = extentRange(extent.yExtent);

		if (xRange > yRange) {
			newExtent.yExtent = fitSmallerExtent(xRange, extent.yExtent);
			newExtent.xExtent = extent.xExtent;
		} else {
			newExtent.xExtent = fitSmallerExtent(yRange, extent.xExtent);
			newExtent.yExtent = extent.yExtent;
		}
		return newExtent;
	}

	$: newExtent = adjustExtentToFit(extent);
	$: xMinMax = convertExtentToArray(newExtent.xExtent);
	$: yMinMax = convertExtentToArray(newExtent.yExtent);
</script>

<ScaledTrackerRegl
	{width}
	{height}
	{points}
	{colorRange}
	{xMinMax}
	{yMinMax}
	on:view
	on:create
	on:draw
	on:select
	on:deselect />

<style>
	/*  put stuff here */
</style>
