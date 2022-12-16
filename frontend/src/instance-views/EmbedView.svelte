<script lang="ts">
	import ReglScatterplot from "./scatter/ReglScatterplot.svelte";

	import { checkEmbedExists, projectEmbedInto2D } from "../api";
	import { model, transform } from "../stores";
	import { onMount } from "svelte";
	import { scaleLinear } from "d3-scale";
	import type { ScaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import type { ReglScatterplotHover } from "./scatter/types";

	export let currentResult;
	export let table;
	export let viewFunction;
	export let viewOptions = {};

	let height = 800;
	let width = 1000;
	let pointSizeSlider = 3;
	let embedExists = false;
	let points: Points2D;
	let pointToWebGL: {
		x: ScaleLinear<number, number>;
		y: ScaleLinear<number, number>;
		scale: (points: Points2D) => void;
	};
	let hover: ReglScatterplotHover;

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

		return { x: xScaler, y: yScaler, scale };
	}
</script>

{#if embedExists}
	<div id="container">
		{#if points}
			<svg class="background" {width} {height}>
				{#if hover}
					{#each hover.neighbors as d}
						<circle
							cx={d.canvasX}
							cy={d.canvasY}
							r={15}
							fill="none"
							stroke="lightgrey" />
					{/each}
				{/if}
			</svg>
			<div class="overlay">
				<ReglScatterplot
					on:hover={(e) => {
						hover = e.detail;
					}}
					on:lassoIndex={(e) => {
						console.log(e.detail);
					}}
					{width}
					{height}
					data={points}
					pointSize={pointSizeSlider} />
			</div>
			<div id="controls">
				<input type="range" min="1" max="10" bind:value={pointSizeSlider} />
				point size {pointSizeSlider}
			</div>
		{:else}
			Loading
		{/if}
	</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
	#container {
		position: relative;
	}
	.overlay {
		position: relative;
		z-index: 1;
	}
	.background {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
	}
</style>
