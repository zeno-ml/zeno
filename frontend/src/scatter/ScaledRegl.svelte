<script lang="ts">
	import BaseRegl from "./BaseRegl.svelte";
	import * as d3 from "d3";
	import type { IPoints } from "./scatter";

	export let canvasStyle = "";
	export let width = 500;
	export let height = 500;
	export let xMinMax: number[] = [-1, 1];
	export let yMinMax: number[] = [-1, 1];
	export let colorRange: string[] = d3.schemeCategory10 as string[];
	export let points: IPoints[] = new Array(100_000).fill(0).map((_, i) => ({
		x: Math.random() * 3,
		y: Math.random() * 5,
		color: Math.random(),
		opacity: 0.65,
	}));
	export let yPadding = 0;
	export let xPadding = 0;
	$: xWindowMinMax = [-1 + xPadding, 1 - xPadding];
	$: yWindowMinMax = [-1 + yPadding, 1 - yPadding];
	$: xScale = d3.scaleLinear().domain(xMinMax).range(xWindowMinMax);
	$: yScale = d3.scaleLinear().domain(yMinMax).range(yWindowMinMax);
	$: formattedPoints = points.map((p, i) => {
		return [xScale(p.x), yScale(p.y), p.color, p.opacity];
	});
</script>

<BaseRegl
	{width}
	{height}
	availableColors={colorRange}
	points={formattedPoints}
	{canvasStyle}
	on:create
	on:draw
	on:select
	on:deselect
/>
