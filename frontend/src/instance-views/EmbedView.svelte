<script lang="ts">
	import ReglScatterplot from "./scatter/ReglScatterplot.svelte";

	import { onMount } from "svelte";
	import { scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import { checkEmbedExists, projectEmbedInto2D } from "../api";
	import { model, transform, settings, zenoState } from "../stores";
	import { columnHash } from "../util/util";
	import { ZenoColumnType } from "../globals";

	import type { ScaleLinear } from "d3-scale";
	import type { ReglScatterplotHover } from "./scatter/types";

	export let currentResult;
	export let table;
	export let viewFunction: View.Component;
	export let viewOptions: View.Options = {};

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
	let hoverView: HTMLDivElement;

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

	function transformHash() {
		const transformColumn = {
			columnType: ZenoColumnType.TRANSFORM,
			name: $zenoState.transform,
		} as ZenoColumn;
		const transformColumnStr = $zenoState.transform
			? columnHash(transformColumn)
			: "";
		return transformColumnStr;
	}
	function modelHash() {
		const modelColumn = {
			columnType: ZenoColumnType.OUTPUT,
			name: $model,
			transform: $transform,
		} as ZenoColumn;
		const modelColumnStr = $zenoState.model ? columnHash(modelColumn) : "";
		return modelColumnStr;
	}

	function viewComponent(
		entry: View.Entry,
		options: View.Options,
		override?: HTMLDivElement
	) {
		const modelColumn = modelHash();
		const transformColumn = transformHash();

		// if no override, create a new div
		override ??= document.createElement("div");

		// overrides the passed in element with view
		viewFunction(
			override,
			options,
			entry,
			modelColumn,
			columnHash($settings.labelColumn),
			columnHash($settings.dataColumn),
			$settings.dataOrigin,
			transformColumn,
			columnHash($settings.idColumn)
		);

		return override;
	}
</script>

{#if embedExists}
	<div id="container">
		{#if points}
			<svg class="background" {width} {height}>
				{#if hover}
					<circle
						cx={hover.neighbor.canvasX}
						cy={hover.neighbor.canvasY}
						r={15}
						fill="none"
						stroke="lightgrey" />
				{/if}
			</svg>
			<div class="overlay">
				<ReglScatterplot
					on:hover={(e) => {
						hover = e.detail;

						const entry = {
							"0label": "cat",
							"0id": "cat/0304.jpg",
							"2cifar_net_20": "dog",
						};

						hoverView = viewComponent(entry, viewOptions, hoverView);
					}}
					on:lassoIndex={(e) => {
						console.log(e.detail);
					}}
					{width}
					{height}
					data={points}
					pointSize={pointSizeSlider} />
				{#if hover}
					<div
						id="hover-view"
						style:width="{100}px"
						style:height="{80}px"
						style:left="{hover.neighbor.canvasX + 50}px"
						style:top="{hover.neighbor.canvasY + 50}px">
						<div id="replace-view" bind:this={hoverView} />
					</div>
				{/if}
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
	#hover-view {
		position: absolute;
		z-index: 2;
	}
</style>
