<script lang="ts">
	import LowLevelRegl from "./v2/LowLevelRegl.svelte";

	interface ScatterPoint {
		x: number;
		y: number;
		color?: string;
		opacity?: number;
		size?: number;
		id?: string;
	}
	export let points: ScatterPoint[] = [];
	export let width = 500;
	export let height = 500;
</script>

<LowLevelRegl
	on:lassoIndex={({ detail }) => {
		console.log(detail);
	}}
	colorRange={["#ff0000", "#00ff00", "#0000ff"]}
	{width}
	{height} />

<style>
</style>
