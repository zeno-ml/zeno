<script lang="ts">
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
	export let regionMode = true;
	export let regionPolygon = [];
	export let regionStroke = color("#9B53DF");
	export let regionFill = opacify(regionStroke, 0.25);
	export let colorRange = defaultColors;

	let mousePos = [0, 0];
	let conversion;
	let mouseDown = false;
	let keyDown = false;
	let polygon = [];
	let intervalSample = 1;
	let currInterval = 0;

	$: svgPolygon = polygon.map(([x, y]) => [
		conversion.xViewScale(x),
		conversion.yViewScale(y),
	]);
	$: polygonString = svgPolygon.reduce(
		(acc, item) => acc + " " + item.toString(),
		""
	);

	function opacify(colorObj: RGBColor | HSLColor, opacity: number) {
		const colorCopy = colorObj.copy();
		colorCopy.opacity = opacity;
		return colorCopy;
	}
	function addPolygon({ mousePos, conversionObj }) {
		const pointPos = conversionObj.screenSpaceToPointSpace(mousePos);
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
							conversionObj.xViewScale.invert(mousePos[0]),
							conversionObj.yViewScale.invert(mousePos[1]),
						],
					];
					regionPolygon = [...regionPolygon, [...pointPos]];
					currInterval = 0;
				}
			}
		}
	}
</script>

<svelte:window
	on:keyup={() => {
		if (regionMode) {
			keyDown = false;
		}
	}}
	on:keydown={(e) => {
		if (regionMode) {
			keyDown = e.key === "Shift";
			if (keyDown) {
				polygon = [];
				currInterval = 0;
			}
		}
	}} />
<div id="scatter" style:width="{width}px" style:height="{height}px">
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
					addPolygon({
						mousePos,
						conversionObj: conversion,
					});
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
					style="border: 3px dashed {regionStroke.toString()}; position:absolute; left:0; top: 0;"
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
</div>

<style>
	#scatter {
		position: relative;
	}
</style>
