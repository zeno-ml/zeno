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

<div id="legend" class="no-select">
	<div id="legend-title">Color Legend</div>
	<div id="legend-actual">
		<DiscreteLegend {data} width={100} {gap} {squareWidth} {height} />
	</div>
</div>

<style lang="scss">
	.no-select {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	#legend {
		border-radius: 3px;
		background-color: hsla(0, 0%, 100%, 0.5);
		border: 1px solid hsla(0, 0%, 0%, 0.05);
		backdrop-filter: blur(10px);
		display: inline-block;
		padding: 10px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 0%, 0.05);

		#legend-title {
			font-size: 18px;
			font-weight: 400;
			color: rgba(52, 52, 52, 0.542);
		}
		#legend-actual {
			margin: 10px;
		}
	}
</style>
