<script lang="ts">
	import VerticalSquares from "./VerticalSquares.svelte";
	import { interpolateColorToArray } from "../discovery";
	import { interpolateCool as defaultInterpolate } from "d3-scale-chromatic";

	export let width = 75;
	export let height = 250;
	export let x = 0;
	export let y = 0;
	export let gap = 0.1;
	export let squareWidth = 10;
	export let data = interpolateColorToArray(defaultInterpolate, 10).map(
		(d, i) => ({
			color: d,
			value: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`,
		})
	);
	export let textStyle = "";
	export let textProps = {};
	let squareLocations = {};
</script>

<svg {width} {height} {x} {y}>
	<VerticalSquares
		{height}
		{squareWidth}
		{gap}
		colors={data.map((item) => item.color)}
		bind:exportSquares={squareLocations}
	/>
	{#if "yOffset" in squareLocations && "squareHeight" in squareLocations && "squareWidth" in squareLocations}
		{#each data as d, i}
			{@const textY =
				squareLocations["yOffset"][i] +
				squareLocations["squareHeight"] / 2 +
				7}
			{@const textX = squareLocations["squareWidth"] + 4}
			<text
				style={textStyle}
				x={textX}
				y={textY}
				fill={d.color}
				stroke={"black"}
				stroke-width={0.3}
				{...textProps}
			>
				{d.value}
			</text>
		{/each}
	{/if}
</svg>

<style>
</style>
