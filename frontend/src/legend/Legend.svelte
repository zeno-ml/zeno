<script lang="ts">
	import DiscreteLegend from "./DiscreteLegend.svelte";
	export let data = [
		{ color: "red", value: "1" },
		{ color: "blue", value: "2" },
	];
	export let gap = 0.2;
	export let squareWidth = 10;
	export let height = 250;
</script>

<div id="legend">
	<div id="legend-title">Color Legend</div>
	<div id="legend-actual">
		<DiscreteLegend {data} width={100} {gap} {squareWidth} {height} />
	</div>
</div>

<style lang="scss">
	#legend {
		border-radius: 3px;
		background-color: hsla(0, 0%, 100%, 0.5);
		border: 1px solid hsla(0, 0%, 0%, 0.05);
		backdrop-filter: blur(30px);
		display: inline-block;
		padding: 10px;

		#legend-title {
			font-size: 18px;
		}
		#legend-actual {
			margin: 10px;
		}
	}
</style>
