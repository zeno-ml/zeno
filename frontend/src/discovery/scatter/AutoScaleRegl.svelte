<script lang="ts">
	import LowLevelRegl from "./LowLevelRegl.svelte";
	import { scaleLinear } from "d3-scale";
	import { extentXY } from "../../util/util";
	import type { ScatterRows, ReglConfig, ColorRange } from "./scatter";

	export let width: number;
	export let height: number;
	export let data: ScatterRows = [];
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};

	// eachDim will do a separate scale based on min and max of each x and y independently
	// maxDim will scale by the larger min max of the x and y min maxs
	// maxDim makes the interval in the space the same for x and y axis, eachDim does not
	export let downScale: "eachDim" | "maxDim" = "maxDim";

	$: downScaler =
		downScale === "maxDim" ? adjustExtentToFit : (extent: XYExtent) => extent;
	$: minMax = downScaler(
		extentXY(
			data,
			(d) => d.x,
			(d) => d.y
		)
	);
	$: xExtent = minMax.xExtent;
	$: yExtent = minMax.yExtent;
	const webGLExtent = [-1, 1];

	$: xScale = scaleLinear()
		.domain([xExtent.min, xExtent.max])
		.range(webGLExtent);
	$: yScale = scaleLinear()
		.domain([yExtent.min, yExtent.max])
		.range(webGLExtent);
	$: fitPoints = data.map((p) => {
		return { ...p, x: xScale(p.x), y: yScale(p.y) };
	});

	function extentRange(extent: Extent) {
		return extent.max - extent.min;
	}
	function fitSmallerExtent(
		largerRange: number,
		smallerExtent: Extent
	): Extent {
		const smallerMidpoint = (smallerExtent.min + smallerExtent.max) / 2;
		const halfRange = largerRange / 2;
		return {
			min: smallerMidpoint - halfRange,
			max: smallerMidpoint + halfRange,
		};
	}
	function adjustExtentToFit(extent: XYExtent): XYExtent {
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
</script>

<LowLevelRegl
	on:lassoIndex
	data={fitPoints}
	{height}
	{width}
	{config}
	{colorRange} />
