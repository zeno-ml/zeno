<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import { scaleLinear } from "d3-scale";
	import type {
		ReglScatterData,
		ReglScatterConfig,
		ReglScatterColorRange,
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
	export let data: ReglScatterData = {
		x: [],
		y: [],
	};
	export let colorRange: ReglScatterColorRange = [];
	export let config: ReglScatterConfig = {};
	export let pointSize = 5;
	export let opacity = 0.85;
	export let pointColor = "#6a1b9a";
	export let pointOutline = 3;

	let xScale = scaleLinear().domain([-1, 1]);
	let yScale = scaleLinear().domain([-1, 1]);
	let scatterPtr: ReglScatterObject;
	let canvasEl: HTMLCanvasElement;

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

	// update when the colorRange changes, but now when the scatter changes
	$: updateColorRange(colorRange);

	onMount(() => {
		init();
	});

	onDestroy(() => {
		scatterPtr.destroy();
	});

	function updateColorRange(colorRange: ReglScatterColorRange) {
		if (scatterPtr && colorRange) {
			scatterPtr.set({
				colorBy: "category",
				pointColor: colorRange,
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
			pointColor: pointColor,
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

	function draw(points: ReglScatterData) {
		if (scatterPtr) {
			scatterPtr.draw(points, {
				transition: true,
				transitionDuration: 1200,
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

<canvas bind:this={canvasEl} on:mousemove on:mouseleave on:mouseenter />
