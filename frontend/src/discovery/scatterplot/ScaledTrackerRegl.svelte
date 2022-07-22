<script lang="ts">
	import type { LegendaryScatterPoint } from "./scatter";

	import BaseRegl from "./BaseRegl.svelte";
	import { scaleLinear } from "d3-scale";
	import { schemeCategory10 } from "d3-scale-chromatic";
	import { createEventDispatcher } from "svelte";

	export let canvasStyle = "";
	export let width = 500;
	export let height = 500;
	export let xMinMax: number[] = [-1, 1];
	export let yMinMax: number[] = [-1, 1];
	export let colorRange: string[] = schemeCategory10 as string[];
	export let points: LegendaryScatterPoint[] = [];
	export let yPadding = 0;
	export let xPadding = 0;
	export let xScaleTracker = scaleLinear().domain([-1, 1]);
	export let yScaleTracker = scaleLinear().domain([-1, 1]);

	const dispatch = createEventDispatcher();

	$: xWindowMinMax = [-1 + xPadding, 1 - xPadding];
	$: yWindowMinMax = [-1 + yPadding, 1 - yPadding];
	$: xScale = scaleLinear().domain(xMinMax).range(xWindowMinMax);
	$: yScale = scaleLinear().domain(yMinMax).range(yWindowMinMax);
	$: formattedPoints = points.map((p) => {
		return [xScale(p.x), yScale(p.y), p.color, p.opacity, p.id];
	});

	function screenSpaceToPointSpace(screenSpacePoint: [number, number]) {
		const [x, y] = screenSpacePoint;
		const pointSpacePoint = [
			xScale.invert(xScaleTracker.invert(x)),
			yScale.invert(yScaleTracker.invert(y)),
		];
		return pointSpacePoint;
	}
</script>

<BaseRegl
	{width}
	{height}
	availableColors={colorRange}
	points={formattedPoints}
	{canvasStyle}
	createScatterConfig={{ xScale: xScaleTracker, yScale: yScaleTracker }}
	on:create={(e) => {
		e.detail.subscribe(
			"view",
			() => {
				dispatch("view", {
					xViewScale: xScaleTracker,
					yViewScale: yScaleTracker,
					xPointScale: xScale,
					yPointScale: yScale,
					screenSpaceToPointSpace,
				});
			},
			null
		);
		dispatch("create", e.detail);
	}}
	on:draw
	on:select
	on:deselect />
