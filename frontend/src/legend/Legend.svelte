<script lang="ts">
	import DiscreteLegend from "./DiscreteLegend.svelte";
</script>

<div id="legend">
	<div id="legend-title">Color Legend</div>
	<div id="legend-actual">
		<DiscreteLegend />
	</div>
</div>

<style lang="scss">
	#legend {
		border-radius: 3px;
		background-color: hsla(0, 0%, 100%, 0.15);
		border: 1px solid hsla(0, 0%, 0%, 0.05);
		backdrop-filter: blur(5px);
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
