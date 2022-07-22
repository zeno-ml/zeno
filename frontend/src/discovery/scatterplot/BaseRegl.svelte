<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import type { Properties } from "regl-scatterplot/dist/types";
	import { interpolateBuPu } from "d3-scale-chromatic";
	import { interpolateColorToArray } from "../discovery";

	const dispatch = createEventDispatcher();

	export let width: number;
	export let height: number;
	export let points = generatePoints(10000);
	export let availableColors = interpolateColorToArray({
		colorer: interpolateBuPu,
		length: 100,
	}) as string[];
	export let availableOpacities = opacityRange(100);
	export let canvasStyle: string = "";
	export let createScatterConfig: Partial<Properties> = {};

	let canvasEl: HTMLCanvasElement;
	let scatterRef;
	let mounted = false;

	$: {
		if (canvasEl && mounted) {
			createScatter(canvasEl, createScatterConfig);
		}
	}
	$: {
		const pointsPopulated = points.length > 0;
		const scatterCreated = scatterRef !== undefined;
		if (scatterCreated && pointsPopulated) {
			opacifyPoints(scatterRef, availableOpacities);
			colorPoints(scatterRef, availableColors);
			scatterRef.draw(points);
			dispatch("draw", scatterRef);
		}
	}

	onMount(() => {
		mounted = true;
	});
	onDestroy(() => {
		scatterRef.destroy();
	});

	function createScatter(canvasEl, config = createScatterConfig) {
		if (canvasEl) {
			if (scatterRef !== undefined) {
				scatterRef.destroy();
			}
			const scatter = createScatterPlot({
				canvas: canvasEl,
				width,
				height,
				...config,
			});

			addSelectionDispatch(scatter);
			opacifyPoints(scatter, availableOpacities);
			colorPoints(scatter, availableColors);
			scatterRef = scatter;
			dispatch("create", scatterRef);
		}
	}

	function opacifyPoints(
		scatter,
		opacities = availableOpacities,
		dataType = "value"
	) {
		scatter.set({
			opacityBy: dataType,
			opacity: opacities,
		});
	}
	function colorPoints(
		scatter,
		colors = availableColors,
		dataType = "category"
	) {
		scatter.set({
			colorBy: dataType,
			pointColor: colors,
		});
	}
	function addSelectionDispatch(scatter) {
		scatter.subscribe("deselect", deselectPoints, null);
		scatter.subscribe("select", (d) => exportSelectedPoints(d.points), null);
	}
	function exportSelectedPoints(idx: number[]) {
		const pointsExport = idx.map((i) => ({
			index: i,
			point: points[i],
			id: points[i][4],
		}));
		dispatch("select", pointsExport);
	}
	function deselectPoints() {
		dispatch("deselect", { deseleted: true });
	}

	function generatePoints(num) {
		const newPoints = [
			...new Array(Math.round((num * 2) / 12)).fill(0).map(() => [
				-1 + (Math.random() * 2 * 1) / 3, // x
				-1 + Math.random() * 2, // y
				0, // category
				Math.random(),
			]),
			...new Array(Math.round((num * 4) / 12)).fill(0).map(() => [
				-1 + 2 / 3 + (Math.random() * 2 * 1) / 3, // x
				-1 + Math.random() * 2, // y
				1, // value
				Math.random(), // value
			]),
			...new Array(Math.round((num * 6) / 12)).fill(0).map(() => [
				-1 + 4 / 3 + (Math.random() * 2 * 1) / 3, // x
				-1 + Math.random() * 2, // y
				90,
				Math.random(),
			]),
		];
		return newPoints;
	}

	function opacityRange(n: number = 10) {
		return new Array(n).fill(0).map((_, i) => (i + 1) / n);
	}
</script>

<canvas bind:this={canvasEl} {width} {height} style={canvasStyle} />
