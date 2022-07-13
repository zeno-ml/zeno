<script lang="ts">
	import Legend from "../legend/Legend.svelte";
	import AutoscaledRegl from "./AutoscaledRegl.svelte";
	import { schemeCategory10 } from "d3-scale-chromatic";
	import { color, HSLColor, RGBColor } from "d3-color";
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	const defaultColors = schemeCategory10 as string[];
	export let width = 800;
	export let height = 800;
	export let points = new Array(10_000).fill(0).map((_, i) => ({
		color: Math.random(),
		opacity: 0.65,
		x: (Math.PI * i) / 2,
		y: Math.sin(i),
	}));
	export let legend = defaultColors.map((c, i) => ({
		color: c,
		value: `${i}`,
	}));
	$: colorRange = legend.map((item) => item.color);
	let mousePos = [0, 0];
	let conversion;

	let mouseDown = false;
	let keyDown = false;
	export let regionMode = true;
	let polygon = [];
	export let regionPolygon = [];
	$: svgPolygon = polygon.map(([x, y]) => [
		conversion.xViewScale(x),
		conversion.yViewScale(y),
	]);
	$: polygonString = svgPolygon.reduce(
		(acc, item) => acc + " " + item.toString(),
		""
	);
	let intervalSample = 1;
	let currInterval = 0;

	function opacify(colorObj: RGBColor | HSLColor, opacity: number) {
		const colorCopy = colorObj.copy();
		colorCopy.opacity = opacity;
		return colorCopy;
	}
	let regionStroke = color("lightgreen");
	let regionFill = opacify(regionStroke, 0.25);
</script>

<svelte:window
	on:keyup={(e) => {
		if (regionMode) {
			keyDown = false;
		}
	}}
	on:keydown={(e) => {
		if (regionMode) {
			keyDown = e.key === "Shift";
			polygon = [];
			currInterval = 0;
		}
	}} />
<div id="legendary" style:width="{width}px" style:height="{height}px">
	{#if points.length > 0}
		<div
			id="bottom-scatter"
			on:mousedown={() => {
				if (regionMode) {
					if (keyDown) {
						polygon = [];
						currInterval = 0;
					}
					mouseDown = true;
				}
			}}
			on:mouseup={() => {
				if (regionMode) {
					mouseDown = false;
				}
			}}
			on:mousemove={(e) => {
				if (conversion) {
					mousePos[0] = e.offsetX;
					mousePos[1] = e.offsetY;
					const pointPos = conversion.screenSpaceToPointSpace(mousePos);
					dispatch("mousemove", {
						mousePos,
						pointPos,
					});
					if (regionMode) {
						if (keyDown && mouseDown) {
							currInterval++;
							if (currInterval >= intervalSample) {
								polygon = [
									...polygon,
									[
										conversion.xViewScale.invert(mousePos[0]),
										conversion.yViewScale.invert(mousePos[1]),
									],
								];
								regionPolygon = [...regionPolygon, [...pointPos]];
								console.log(polygon);
								currInterval = 0;
							}
						}
					}
				}
			}}>
			<AutoscaledRegl
				{width}
				{height}
				{colorRange}
				{points}
				on:view={(e) => {
					conversion = e.detail;
				}}
				on:create
				on:draw
				on:select
				on:deselect />
			{#if regionMode}
				<svg
					style="border: 3px dashed lightgreen; position:absolute; left:0; top: 0;"
					{width}
					{height}>
					<polygon
						points={polygonString}
						stroke={regionStroke.toString()}
						fill={regionFill.toString()}
						stroke-width={2} />
				</svg>
			{/if}
		</div>
	{/if}
	<!-- <div id="top-legend">
		<Legend gap={5} data={legend} squareWidth={25} />
	</div> -->
	<!-- <div style="position: absolute; left: {mousePos[0]}px; top: {mousePos[1]}px;">
		mouse here
	</div> -->
</div>

<style lang="scss">
	#legendary {
		position: relative;
		// border: 1px solid lightgray;
		#top-legend {
			position: absolute;
			left: 11px;
			top: 11px;
		}
	}
</style>
