<script lang="ts">
	import { metric, metrics, metricRange } from "../stores";
</script>

{#if $metrics.length !== 0 && $metricRange[0] !== Infinity}
	<div id="legend-container">
		<span style:margin-right="15px" style:font-style="italic">
			{$metric}:
		</span>
		<span
			contenteditable="true"
			on:blur={(e) =>
				metricRange.update((range) => {
					range[0] = parseFloat(e.currentTarget.innerText);
					return [...range];
				})}>
			{$metricRange[0].toFixed(2)}
		</span>
		<div id="legend" />
		<span
			contenteditable="true"
			on:blur={(e) =>
				metricRange.update((range) => {
					range[1] = parseFloat(e.currentTarget.innerText);
					return [...range];
				})}>
			{$metricRange[1].toFixed(2)}
		</span>
	</div>
{/if}

<style>
	#legend-container {
		display: flex;
		align-items: center;
		margin-right: 5px;
	}
	#legend {
		width: 40px;
		height: 15px;
		margin-left: 10px;
		margin-right: 10px;
		background-image: linear-gradient(to right, #decbe9, #6a1b9a);
	}
</style>
