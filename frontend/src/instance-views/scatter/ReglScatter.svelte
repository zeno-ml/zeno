<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import { scaleLinear } from "d3-scale";
	import { quadtree, type Quadtree } from "d3-quadtree";
	import type {
		ReglScatterData,
		ReglScatterConfig,
		ReglScatterColorRange,
		ReglScatterObject,
		ReglScatterMousemove,
	} from "./scatterTypes";

	const dispatch = createEventDispatcher<{
		lassoIndex: number[];
		mount: ReglScatterObject;
		mousemove: ReglScatterMousemove;
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

	let xScale = scaleLinear().domain([-1, 1]);
	let yScale = scaleLinear().domain([-1, 1]);
	let scatterPtr: ReglScatterObject;
	let canvasEl: HTMLCanvasElement;
	let quad: Quadtree<[number, number, number]>;

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
			quad = createQuadtree(data);
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
			lassoColor: "#6a1b9a",
		});
		scatterPtr.set({
			opacity: 1.0,
			pointColor: "#6a1b9a",
			pointColorHover: "#000000",
			pointColorActive: "#000000",
		});
		dispatch("mount", scatterPtr);
		dispatchLasso();
	}

	function draw(points: ReglScatterData) {
		if (scatterPtr) {
			scatterPtr.draw(points, {
				transition: true,
				transitionDuration: 1200,
			});
		}
	}
	function dispatchLasso() {
		if (scatterPtr) {
			scatterPtr.subscribe(
				"deselect",
				() => {
					dispatch("lassoIndex", []);
				},
				null
			);
			scatterPtr.subscribe(
				"select",
				(d) => {
					if (d) {
						dispatch("lassoIndex", d["points"]);
					}
				},
				null
			);
		}
	}

	function createQuadtree(points: ReglScatterData) {
		let combined: [number, number, number][] = [];
		points.x.forEach((x, i) => {
			combined.push([x, points.y[i], i]);
		});

		const quad = quadtree<[number, number, number]>();
		quad.addAll(combined);
		return quad;
	}
</script>

<canvas
	bind:this={canvasEl}
	on:wheel={() => {
		dispatch("mousemove", undefined);
	}}
	on:mousemove={(e) => {
		const canvasX = e.offsetX;
		const canvasY = e.offsetY;

		const pointX = xScale.invert(canvasX);
		const pointY = yScale.invert(canvasY);
		const [nearestX, nearestY, nearestIndex] = quad.find(pointX, pointY);

		dispatch("mousemove", {
			mouse: {
				canvasX,
				canvasY,
			},
			neighbor: {
				index: nearestIndex,
				canvasX: xScale(nearestX),
				canvasY: yScale(nearestY),
			},
		});
	}}
	on:mouseleave
	on:mouseenter />
