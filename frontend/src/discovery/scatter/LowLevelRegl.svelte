<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import type {
		ScatterRows,
		ReglScatterColumns,
		ReglConfig,
		ColorRange,
	} from "./scatter";

	type ReglScatterReference = ReturnType<typeof createScatterPlot>;

	const dispatch = createEventDispatcher();

	export let width: number;
	export let height: number;
	export let data: ScatterRows = [];
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};

	// format data that regl-scatterplot expects
	// change the {}[] to {} with arrays inside
	// shift colors down to regl-scatterplot reads as categorical color
	const colorIndexShift = 2;
	$: fixedPoints = minorToMajorRegl(data, colorIndexShift);
	$: fudgeColorShift = new Array(colorIndexShift).fill("#cccccc");
	$: fixedColorRange = [...fudgeColorShift, ...colorRange];

	let scatterPtr: ReglScatterReference;
	let canvasEl: HTMLCanvasElement;

	onMount(() => {
		scatterPtr = createScatterPlot({
			canvas: canvasEl,
			width,
			height,
			...config,
		});

		// point[0] is x and point [1] is y
		// then...
		// set point[2] as the color
		scatterPtr.set({
			colorBy: "category",
			pointColor: fixedColorRange,
		});
		// set point[3] as the opacity
		scatterPtr.set({
			opacityBy: "value",
			opacity: opacityRange(10),
		});

		dispatchLasso();
		draw(fixedPoints);
	});
	onDestroy(() => {
		scatterPtr.destroy();
	});

	function draw(points: ReglScatterColumns) {
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
					dispatch("lassoIndex", null);
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
	function minorToMajorRegl(
		data: ScatterRows,
		colorShift = 2
	): ReglScatterColumns {
		const major = {
			x: [],
			y: [],
			category: [], // color
			value: [], // opacity
		};

		data.forEach((minor) => {
			major.x.push(minor.x);
			major.y.push(minor.y);
			major.category.push(minor.colorIndex + colorShift);
			major.value.push(minor.opacity);
		});

		return major;
	}

	function opacityRange(n = 10) {
		return new Array(n).fill(0).map((_, i) => (i + 1) / n);
	}
</script>

<canvas bind:this={canvasEl} {width} {height} />

<style>
	/*  put stuff here */
</style>
