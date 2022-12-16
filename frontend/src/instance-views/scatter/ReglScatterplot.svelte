<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from "svelte";
	import createScatterPlot from "regl-scatterplot";
	import type {
		ScatterColumnsFormat,
		ReglConfig,
		ColorRange,
		ReglScatterplotObj,
	} from "./types";

	const dispatch = createEventDispatcher<{
		lassoIndex: number[];
		mount: ReglScatterplotObj;
	}>();

	export let width: number;
	export let height: number;
	export let data: ScatterColumnsFormat = {
		x: [],
		y: [],
	};
	export let colorRange: ColorRange = [];
	export let config: ReglConfig = {};
	export let pointSize = 5;

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
	function opacityRange(n = 10) {
		return new Array(n).fill(0).map((_, i) => (i + 1) / n);
	}
</script>

<canvas bind:this={canvasEl} />
