<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import { scaleLinear } from "d3-scale";
	import { WEBGL_EXTENT } from "./index";
	import type {
		ReglScatterConfig,
		ReglScatterObject,
		ReglScatterPointDispatch,
	} from "./index";
	import {
		BOOLEAN_COLOR_SCALE,
		CONTINUOUS_COLOR_SCALE,
		NOMINAL_COLOR_SCALE,
	} from "./colors";

	const dispatch = createEventDispatcher<{
		deselect: number[];
		select: number[];
		pointOver: ReglScatterPointDispatch;
		pointOut: ReglScatterPointDispatch;
		mount: ReglScatterObject;
	}>();

	export let width: number;
	export let height: number;
	export let data: Points2D;
	export let config: ReglScatterConfig = {};
	export let pointSize = 5;
	// export let opacity = 0.85;
	export let pointColor = "#6a1b9a";
	export let pointOutline = 3;
	export let style = "";

	const COLOR_SCALE_MAP = {
		nominal: NOMINAL_COLOR_SCALE,
		continuous: CONTINUOUS_COLOR_SCALE,
		boolean: BOOLEAN_COLOR_SCALE,
	};

	let xScale = scaleLinear().domain(WEBGL_EXTENT); // between [-1, 1] -> canvas X
	let yScale = scaleLinear().domain(WEBGL_EXTENT); // between [-1, 1] -> canvas Y
	let scatterPtr: ReglScatterObject;
	let canvasEl: HTMLCanvasElement;
	let modeCssClass: "normal-mode" | "pan-mode" | "lasso-mode" = "normal-mode";

	$: scatterPtr?.set({
		pointSize,
	});

	$: scatterPtr?.set({
		width,
		height,
	});

	$: if (scatterPtr) {
		updateColorRange(data?.domain);
	}

	$: {
		// make sure this is not called before we actually create the scatterPtr
		if (scatterPtr && data?.x.length > 0) {
			draw(data);
		}
	}

	onMount(() => {
		init();
		dispatch("mount", scatterPtr);
	});

	onDestroy(() => {
		scatterPtr.destroy();
	});

	function updateOpacityRange(scatterPtr: ReglScatterObject, length: number) {
		scatterPtr.set({
			opacityBy: "category",
			opacity: new Array(length).fill(0).map((_, i) => i / (length - 1)),
		});
	}

	function updateColorRange(domain: (number | string)[]) {
		if (scatterPtr && domain) {
			scatterPtr.set({
				colorBy: "value",
				pointColor: COLOR_SCALE_MAP[data.dataType],
			});
		}
	}

	function init() {
		scatterPtr = createScatterPlot({
			canvas: canvasEl,
			width,
			height,
			xScale,
			yScale,
			...config,
		});

		scatterPtr.set({
			lassoColor: pointColor,
			pointColorHover: pointColor,
			pointColorActive: pointColor,
			backgroundColor: "#FFFFFF",
			// opacity,
			pointOutlineWidth: pointOutline,
		});

		updateOpacityRange(scatterPtr, 10);

		// listeners
		listenLasso();
		listenPointHover();
	}

	function draw(points: Points2D) {
		if (scatterPtr) {
			scatterPtr.draw({
				x: points.x,
				y: points.y,
				category: points.opacity,
				value: points.color,
			});
		}
	}

	function listenPointHover() {
		if (scatterPtr) {
			scatterPtr.subscribe(
				"pointOut",
				(index) => {
					const canvasX = xScale(data.x[index]);
					const canvasY = yScale(data.y[index]);
					dispatch("pointOut", {
						index,
						canvasX,
						canvasY,
					});
				},
				null
			);
			scatterPtr.subscribe(
				"pointOver",
				(index) => {
					const canvasX = xScale(data.x[index]);
					const canvasY = yScale(data.y[index]);
					dispatch("pointOver", {
						index,
						canvasX,
						canvasY,
					});
				},
				null
			);
		}
	}

	function listenLasso() {
		if (scatterPtr) {
			scatterPtr.subscribe(
				"deselect",
				() => {
					dispatch("deselect", []);
				},
				null
			);
			scatterPtr.subscribe(
				"select",
				(d) => {
					if (d) {
						dispatch("select", d["points"]);
					}
				},
				null
			);
		}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === "Shift") {
			modeCssClass = "lasso-mode";
		}
	}}
	on:keyup={() => {
		modeCssClass = "normal-mode";
	}}
	on:mousedown={() => {
		if (modeCssClass !== "lasso-mode") {
			modeCssClass = "pan-mode";
		}
	}}
	on:mouseup={() => {
		modeCssClass = "normal-mode";
	}} />

<canvas
	{style}
	class={modeCssClass}
	bind:this={canvasEl}
	on:mousemove
	on:mouseleave
	on:mouseenter />

<style>
	.normal-mode {
		cursor: default;
	}
	.pan-mode {
		cursor: move;
	}
	.lasso-mode {
		cursor: crosshair;
	}
</style>
