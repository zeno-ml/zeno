<script lang="ts">
	import BaseRegl from "./BaseRegl.svelte";
	import { scaleLinear } from "d3-scale";
	import { schemeCategory10 } from "d3-scale-chromatic";
	import type { LegendaryScatterPoint } from "./scatter";

	export let canvasStyle = "";
	export let width = 500;
	export let height = 500;
	export let xMinMax: number[] = [-1, 1];
	export let yMinMax: number[] = [-1, 1];
	export let colorRange: string[] = schemeCategory10 as string[];
	export let points: LegendaryScatterPoint[] = new Array(100_000)
		.fill(0)
		.map(() => ({
			x: Math.random() * 3,
			y: Math.random() * 5,
			color: Math.random(),
			opacity: 0.65,
		}));
	export let yPadding = 0;
	export let xPadding = 0;
	$: xWindowMinMax = [-1 + xPadding, 1 - xPadding];
	$: yWindowMinMax = [-1 + yPadding, 1 - yPadding];
	$: xScale = scaleLinear().domain(xMinMax).range(xWindowMinMax);
	$: yScale = scaleLinear().domain(yMinMax).range(yWindowMinMax);
	$: formattedPoints = points.map((p) => {
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
	on:deselect />
