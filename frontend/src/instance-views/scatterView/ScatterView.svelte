<script lang="ts">
	import ReglScatter from "./reglScatter/ReglScatter.svelte";
	import NoEmbed from "./NoEmbed.svelte";
	import { BarLoader as Spinner } from "svelte-loading-spinners";
	import { Icon } from "@smui/icon-button";
	import Slider from "@smui/slider";
	import FormField from "@smui/form-field";
	import { scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import {
		checkEmbedExists,
		getEntry,
		projectEmbedInto2D,
		createViewComponent,
	} from "../../api";
	import { model, transform } from "../../stores";
	import type { ScaleLinear } from "d3-scale";
	import type { ReglScatterPointDispatch } from "./reglScatter";

	export let currentResult;
	export let table;
	export let viewFunction: View.Component;
	export let viewOptions: View.Options = {};
	export let autoResize = true;

	let height = 850;
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

<div id="scatter-view">
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
							style="outline: 1px solid lavender"
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

						<!-- settings/controls for the scatterplot -->
						<div id="settings" class="frosted">
							<div class="title">
								<Icon
									class="material-icons"
									style="font-size: inherit; color: inherit;">settings</Icon>
								Settings
							</div>
							<FormField style="display: flex;">
								<span
									slot="label"
									style="padding-right: 12px; width: max-content; display: block;">
									Point Size
								</span>
								<Slider
									step={1}
									min={1}
									max={10}
									bind:value={pointSizeSlider}
									discrete
									style="width: 100%" />
							</FormField>
						</div>
					</div>

					<div id="instruction">
						<div><kbd>drag</kbd> to pan / move around</div>
						<div><kbd>scroll</kbd> to zoom</div>
						<div>
							<kbd>Shift</kbd> + <kbd>drag</kbd> to lasso select points
						</div>
						<div>
							<kbd>Esc</kbd> or double click to clear lasso selection
						</div>
					</div>
				{/if}
			{:else}
				<!--  Loading bar -->
				<div id="loading-indicator" style:color="#6a1b9a">
					<Spinner color="#6a1b9a" size={80} />
					<b>Computing 2D projection</b> from
					<code>
						{$model}
						{$transform}
					</code> embeddings
				</div>
			{/if}
		</div>
	{:else}
		<NoEmbed />
	{/if}
</div>

<style>
	#scatter-view {
		position: relative;
	}
	#container {
		position: relative;
		width: auto;
		height: auto;
	}
	#hover-view {
		position: absolute;
		z-index: 2;
	}
	#settings {
		position: absolute;
		bottom: 10px;
		right: 10px;
		width: 300px;
		height: 80px;
		z-index: 999;
		padding-left: 20px;
		padding-top: 20px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 30%, 0.1);
		border-radius: 3px;
	}
	#settings .title {
		font-size: 18px;
		font-weight: 400;
	}
	#instruction {
		display: flex;
		margin-top: 10px;
		gap: 18px;
		color: hsl(0, 0%, 50%);
		font-weight: 200;
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
	.frosted {
		background: hsla(0, 0%, 95%, 0.3);
		backdrop-filter: blur(8px);
	}

	/* credit to https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd */
	kbd {
		background-color: #eee;
		border-radius: 3px;
		border: 1px solid #b4b4b4;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
			0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
		display: inline-block;
		color: #333;
		font-size: 0.85em;
		font-weight: 550;
		line-height: 1;
		padding: 2px 4px;
		white-space: nowrap;
	}
</style>
