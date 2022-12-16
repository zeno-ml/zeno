<script lang="ts">
	import ReglScatterplot from "./scatter/ReglScatterplot.svelte";

	import { checkEmbedExists, projectEmbedInto2D } from "../api";
	import { model, transform } from "../stores";
	import { onMount } from "svelte";
	import { scaleLinear } from "d3-scale";
	import type { ScaleLinear } from "d3-scale";
	import { extent } from "d3-array";

	export let currentResult;
	export let table;
	export let viewFunction;
	export let viewOptions = {};

	let height = 800;
	let width = 1000;
	let pointSizeSlider = 5;
	let embedExists = false;
	let points: Points2D;
	let pointToWebGL: {
		x: ScaleLinear<number, number>;
		y: ScaleLinear<number, number>;
		scale: (points: Points2D) => void;
		invert: (points: Points2D) => void;
	};

	onMount(async () => {
		embedExists = await checkEmbedExists($model, $transform);
		points = (await projectEmbedInto2D($model, $transform)) as Points2D;
		pointToWebGL = fitPointsWebgGL(points);

		pointToWebGL.scale(points);
	});

	/**
	 * Create scale for points between [-1, 1] for WebGL canvas
	 * ReglScatterplot expects this range
	 */
	function fitPointsWebgGL(points: Points2D) {
		const WEB_GL_RANGE = [-1, 1];

		const xExtent = extent(points.x);
		const yExtent = extent(points.y);

		const xScaler = scaleLinear().domain(xExtent).range(WEB_GL_RANGE);
		const yScaler = scaleLinear().domain(yExtent).range(WEB_GL_RANGE);

		function scale(points: Points2D) {
			for (let i = 0; i < points.x.length; i++) {
				points.x[i] = xScaler(points.x[i]);
				points.y[i] = yScaler(points.y[i]);
			}
		}

		function invert(points: Points2D) {
			for (let i = 0; i < points.x.length; i++) {
				points.x[i] = xScaler.invert(points.x[i]);
				points.y[i] = yScaler.invert(points.y[i]);
			}
		}

		return { x: xScaler, y: yScaler, scale, invert };
	}
</script>

{#if embedExists}
	<div>Embed View</div>
	<div id="container">
		{#if points}
			<ReglScatterplot
				{width}
				{height}
				data={points}
				pointSize={pointSizeSlider} />
		{/if}
	</div>
	<div>
		<input type="range" min="1" max="10" bind:value={pointSizeSlider} />
		{pointSizeSlider}
	</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
</style>
