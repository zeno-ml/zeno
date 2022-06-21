<script lang="ts">
	import ReglScatter from "./ReglScatter.svelte";

	export let width: number;
	export let height: number;
	export let data: number[][];
</script>

<div id="scatter-container">
	<ReglScatter
		{width}
		{height}
		points={data}
		on:deselect={({ detail: selectedPoints }) => {
			console.log(selectedPoints);
		}}
		on:select={({ detail: selectedPoints }) => {
			console.log(selectedPoints);
		}}
	/>
</div>

<style>
	#scatter-container {
		border: 1px dashed black;
		display: inline-block;
	}
</style>
