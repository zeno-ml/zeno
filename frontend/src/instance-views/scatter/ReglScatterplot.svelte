<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import type {
		ScatterColumnsFormat,
		ReglConfig,
		ColorRange,
		ReglScatterplotObj,
		ReglScatterplotHover,
	} from "./types";
	import { scaleLinear } from "d3-scale";

	const dispatch = createEventDispatcher<{
		lassoIndex: number[];
		mount: ReglScatterplotObj;
		hover: ReglScatterplotHover;
	}>();

	export let numNN = 10;
	export let width: number;
	export let height: number;
	export let data: ScatterColumnsFormat = {
		x: [],
		y: [],
	};
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};
	export let pointSize = 5;

	let xScale = scaleLinear().domain([-1, 1]);
	let yScale = scaleLinear().domain([-1, 1]);

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
	function updateColorRange(colorRange: ColorRange) {
		if (scatterPtr && colorRange) {
			scatterPtr.set({
				colorBy: "category",
				pointColor: colorRange,
			});
		}
	}

	let scatterPtr: ReglScatterplotObj;
	let canvasEl: HTMLCanvasElement;

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

	onMount(init);

	onDestroy(() => {
		scatterPtr.destroy();
	});

	function draw(points: ScatterColumnsFormat) {
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

	function shiftRight<T>(arr: T[], starting = 0) {
		if (starting >= arr.length) {
			return;
		}

		let temp1 = undefined;
		let temp2 = undefined;

		for (let i = starting; i < arr.length; i++) {
			temp1 = temp2;
			temp2 = arr[i];
			arr[i] = temp1;
		}

		return arr;
	}

	function findNearestNeighbors(
		pointX: number,
		pointY: number,
		numNearest = 1
	) {
		const nearestIndices = new Array(numNearest).fill(0).map(() => ({
			index: -1,
			dist: Infinity,
			canvasX: null,
			canvasY: null,
		}));

		for (let i = 0; i < data.x.length; i++) {
			const x = data.x[i];
			const y = data.y[i];
			const dist = (x - pointX) ** 2 + (y - pointY) ** 2;

			for (let j = 0; j < numNearest; j++) {
				if (dist < nearestIndices[j].dist) {
					shiftRight(nearestIndices, j);
					nearestIndices[j] = {
						index: i,
						dist,
						canvasX: null,
						canvasY: null,
					};
					break;
				}
			}
		}

		nearestIndices.forEach((neighbor) => {
			neighbor.canvasX = xScale(data.x[neighbor.index]);
			neighbor.canvasY = yScale(data.y[neighbor.index]);
		});

		return nearestIndices;
	}
</script>

<canvas
	bind:this={canvasEl}
	on:wheel={() => {
		dispatch("hover", undefined);
	}}
	on:mousemove={(e) => {
		const canvasX = e.offsetX;
		const canvasY = e.offsetY;

		const pointX = xScale.invert(canvasX);
		const pointY = yScale.invert(canvasY);
		const neighbors = findNearestNeighbors(pointX, pointY, numNN);
		dispatch("hover", {
			mouse: {
				canvasX,
				canvasY,
			},
			neighbors,
		});
	}}
	on:mouseleave />
