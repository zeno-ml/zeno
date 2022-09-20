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

	$: {
		// make sure this is not called before we actually create the scatterPtr
		if (scatterPtr && data.length > 0) {
			draw(fixedPoints);
		}
	}

	// update when the colorRange changes, but now when the scatter changes
	$: updateColorRange(colorRange);
	function updateColorRange(colorRange: ColorRange) {
		if (scatterPtr && colorRange) {
			scatterPtr.set({
				colorBy: "category",
				pointColor: fixedColorRange,
			});
		}
	}

	let scatterPtr: ReglScatterReference;
	let canvasEl: HTMLCanvasElement;

	onMount(() => {
		scatterPtr = createScatterPlot({
			canvas: canvasEl,
			width,
			height,
			...config,
		});
		scatterPtr.set({
			colorBy: "category",
			pointColor: fixedColorRange,
		});
		scatterPtr.set({
			opacityBy: "value",
			opacity: opacityRange(10),
		});
		dispatchLasso();
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
