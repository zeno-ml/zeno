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

	const dispatch = createEventDispatcher<{
		deselect: number[];
		select: number[];
		pointOver: ReglScatterPointDispatch;
		pointOut: ReglScatterPointDispatch;
	}>();

	export let width: number;
	export let height: number;
	export let data: Points2D;
	export let config: ReglScatterConfig = {};
	export let pointSize = 5;
	export let opacity = 0.85;
	export let pointColor = "#6a1b9a";
	export let pointOutline = 3;
	export let style = "";

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

	$: {
		// make sure this is not called before we actually create the scatterPtr
		if (scatterPtr && data?.x.length > 0) {
			draw(data);
		}
	}

	onMount(() => {
		init();
	});

	onDestroy(() => {
		scatterPtr.destroy();
	});

	function init() {
		scatterPtr = createScatterPlot({
			colorBy: "valueA",
			pointColor: [
				"#002072", // dark blue
				"#162b79",
				"#233680",
				"#2e4186",
				"#394d8d",
				"#425894",
				"#4b649a",
				"#5570a1",
				"#5e7ca7",
				"#6789ae",
				"#7195b4",
				"#7ba2ba",
				"#85aec0",
				"#90bbc6",
				"#9cc7cc",
				"#a9d4d2",
				"#b8e0d7",
				"#c8ecdc",
				"#ddf7df",
				"#ffffe0", // bright yellow
			],
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
			opacity,
			pointOutlineWidth: pointOutline,
		});

		// listeners
		listenLasso();
		listenPointHover();
	}

	function draw(points: Points2D) {
		if (scatterPtr) {
			scatterPtr.draw(
				Array.from(points.x).map((d, i) => [
					points.x[i],
					points.y[i],
					points.color[i],
				]),
				{
					transition: true,
					transitionDuration: 1200,
				}
			);
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
