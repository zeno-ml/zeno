<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import type { Properties } from "regl-scatterplot/dist/types";
	import * as d3 from "d3";
	const dispatch = createEventDispatcher();

	export let width: number;
	export let height: number;
	export let canvasStyle: string = "";
	export let createScatterConfig: Partial<Properties> = {};
	export let points: number[][] = [
		[0, -1],
		[0.1, 0.5],
		[0, 1],
	];
	export let colors = d3.schemeCategory10 as string[];
	export let colorIdxs = [];

	let canvasEl: HTMLCanvasElement;
	let scatterRef;
	function extentXY<T>(
		data: T[],
		xGetter = (d: T) => d[0],
		yGetter = (d: T) => d[1]
	) {
		const firstPoint = data[0];
		let xExtent = { min: xGetter(firstPoint), max: xGetter(firstPoint) };
		let yExtent = { min: yGetter(firstPoint), max: yGetter(firstPoint) };
		for (let i = 1; i < data.length; i++) {
			const value = data[i];
			const xValue = xGetter(value),
				yValue = yGetter(value);
			// mins
			if (xValue < xExtent.min) {
				xExtent.min = xValue;
			}
			if (yValue < yExtent.min) {
				yExtent.min = yValue;
			}
			// maxs
			if (xValue > xExtent.max) {
				xExtent.max = xValue;
			}
			if (yValue > yExtent.max) {
				yExtent.max = yValue;
			}
		}
		return { xExtent, yExtent };
	}

	onMount(() => {
		if (canvasEl) {
			const scatter = createScatterPlot({
				canvas: canvasEl,
				width,
				height,
				...createScatterConfig,
			});
			scatterRef = scatter;
			scatter.set({ colorBy: "valueA", opacityBy: "valueB" });
			scatter.set({
				pointColor: colors as string[],
			});
			scatter.subscribe("deselect", deselectPoints, null);
			scatter.subscribe(
				"select",
				(d) => exportSelectedPoints(d.points),
				null
			);
		}
	});
	$: {
		if (scatterRef !== undefined && points.length > 0) {
			const { xExtent, yExtent } = extentXY(points);
			const rangeGL = [-1, 1];
			const xScale = d3
				.scaleLinear()
				.domain([xExtent.min, xExtent.max])
				.range(rangeGL);
			const yScale = d3
				.scaleLinear()
				.domain([yExtent.min, yExtent.max])
				.range(rangeGL);
			const transformedPoints = points.map((point, i) => [
				xScale(point[0]),
				yScale(point[1]),
				colorIdxs.length > 0 ? colorIdxs[i] : 0,
				0.65,
			]);
			scatterRef.draw(transformedPoints);
		}
	}
	onDestroy(() => {
		scatterRef.destroy();
	});

	function exportSelectedPoints(idx: number[]) {
		const pointsExport = idx.map((i) => ({ index: i, point: points[i] }));
		dispatch("select", pointsExport);
	}
	function deselectPoints() {
		dispatch("deselect", { deseleted: true });
	}
</script>

<canvas bind:this={canvasEl} {width} {height} style={canvasStyle} />

<style>
</style>
