<script lang="ts">
	import Legend from "../legend/Legend.svelte";
	import AutoscaledRegl from "./AutoscaledRegl.svelte";
	import * as d3 from "d3";

	const defaultColors = d3.schemeCategory10 as string[];
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
</script>

<div id="legendary" style:width="{width}px" style:height="{height}px">
	{#if points.length > 0}
		<div id="bottom-scatter">
			<AutoscaledRegl
				{width}
				{height}
				{colorRange}
				{points}
				on:create
				on:draw
				on:select
				on:deselect
			/>
		</div>
	{/if}
	<div id="top-legend">
		<Legend gap={5} data={legend} squareWidth={25} />
	</div>
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
