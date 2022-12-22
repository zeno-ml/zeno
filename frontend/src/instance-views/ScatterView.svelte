<script lang="ts">
	import { BarLoader as Spinner } from "svelte-loading-spinners";
	import ReglScatter from "./scatter/ReglScatter.svelte";
	import AddEmbedInstructions from "../general/AddEmbedInstructions.svelte";
	import { scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import {
		checkEmbedExists,
		getEntry,
		projectEmbedInto2D,
		createViewComponent,
	} from "../api";
	import { model, transform } from "../stores";
	import type { ScaleLinear } from "d3-scale";
	import type { ReglScatterPointDispatch } from "./scatter";

	export let currentResult;
	export let table;
	export let viewFunction: View.Component;
	export let viewOptions: View.Options = {};
	export let autoResize = true;

	let height = 800;
	let width = 1000;
	let pointSizeSlider = 3;
	let embedExists = false;
	let points: Points2D;
	let computingPoints = false;
	let pointToWebGL: {
		x: ScaleLinear<number, number>;
		y: ScaleLinear<number, number>;
		scale: (points: Points2D) => void;
	};
	let pointHover: ReglScatterPointDispatch;
	let hoverViewDivEl: HTMLDivElement;
	let containerEl: HTMLDivElement;

	$: project2DOnModelAndTransformChange($model, $transform);
	$: {
		if (containerEl && autoResize) {
			resizeScatter();
		}
	}

	/**
	 * Main driver behind fetching the projected points and displaying
	 * them in the scale that WebGL expects between [-1, 1]
	 */
	async function project2DOnModelAndTransformChange(
		model: string,
		transform: string
	) {
		// don't do shit if we have no gabagoo
		embedExists = await checkEmbedExists(model, transform);

		if (embedExists) {
			// show spinner
			computingPoints = true;

			// requests tsne from backend
			points = (await projectEmbedInto2D(model, transform)) as Points2D;

			// simply scales the points between [-1, 1]
			pointToWebGL = fitPointsWebgGL(points);
			pointToWebGL.scale(points);

			// stop spinner
			computingPoints = false;
		}
	}

	/**
	 * Create scale for points between [-1, 1] for WebGL canvas
	 * ReglScatterplot expects this range
	 *
	 * scaler function changes points by memory reference
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

	/**
	 * Shows the instance view of the current hovering point
	 * on top of the scatterplot by globally updating hoverViewDivEl
	 * and receiving mouseinfo from ReglScatterplot
	 */
	async function showViewOnPoint(e: CustomEvent<ReglScatterPointDispatch>) {
		pointHover = e.detail;
		const id = points.ids[pointHover.index];

		// fetch the row from the backend given that Id
		const entry = await getEntry(id);

		// create the data view component and replace the div with the new component
		createViewComponent(viewFunction, entry, viewOptions, hoverViewDivEl);
	}
	function clearPointHover() {
		pointHover = undefined;
	}

	function resizeScatter() {
		if (containerEl && autoResize) {
			width = containerEl.clientWidth;
		}
	}
</script>

<svelte:window on:resize={resizeScatter} />

{#if embedExists}
	<div bind:this={containerEl} id="container">
		{#if !computingPoints}
			<!-- highlight nearest point with circle outline  -->
			<svg class="background" {width} {height}>
				{#if pointHover !== undefined}
					<circle
						cx={pointHover.canvasX}
						cy={pointHover.canvasY}
						r={15}
						fill="none"
						stroke="lavender" />
				{/if}
			</svg>

			<!-- Scatterplot and overlay instance on top of nearest point -->
			{#if points}
				<div class="overlay">
					<ReglScatter
						data={points}
						pointSize={pointSizeSlider}
						pointColor="#6a1b9a"
						opacity={0.75}
						{width}
						{height}
						on:pointOver={showViewOnPoint}
						on:pointOut={clearPointHover} />
					{#if pointHover !== undefined}
						<div
							id="hover-view"
							style:width="{100}px"
							style:height="{80}px"
							style:left="{pointHover.canvasX + 50}px"
							style:top="{pointHover.canvasY + 50}px">
							<div id="replace-view" bind:this={hoverViewDivEl} />
						</div>
					{/if}
				</div>
			{/if}

			<!-- settings/controls for the scatterplot -->
			<div id="settings">
				<input type="range" min="1" max="10" bind:value={pointSizeSlider} />
				point size {pointSizeSlider}
			</div>
		{:else}
			<!--  Loading bar -->
			<div id="loading-indicator" style:color="#6a1b9a">
				<Spinner color="#6a1b9a" size={80} />
				<b>Computing 2D projection</b> from
				<code
					>{$model}
					{$transform}</code> embeddings
			</div>
		{/if}
	</div>
{:else}
	<AddEmbedInstructions />
{/if}

<style>
	#container {
		position: relative;
		width: auto;
		height: auto;
		outline: 1px solid lavender;
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
	#hover-view {
		position: absolute;
		z-index: 2;
	}
	#settings {
	}
</style>
