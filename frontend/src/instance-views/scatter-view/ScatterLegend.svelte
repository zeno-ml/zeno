<script lang="ts">
	import {
		BOOLEAN_COLOR_SCALE,
		NOMINAL_COLOR_SCALE,
	} from "./regl-scatter/colors";

	export let domain: string[] = [];
	export let metadataType = "";
</script>

{#if metadataType === "continuous"}
	<div id="legend-container">
		<span>
			{parseFloat(domain[0]).toFixed(2)}
		</span>
		<div id="legend" />
		<span>
			{parseFloat(domain[1]).toFixed(2)}
		</span>
	</div>
{:else if metadataType === "boolean"}
	<div class="legend-item">
		<div
			class="legend-color"
			style="background-color: rgb({BOOLEAN_COLOR_SCALE[0][0] +
				',' +
				BOOLEAN_COLOR_SCALE[0][1] +
				',' +
				BOOLEAN_COLOR_SCALE[0][2]})" />
		<div class="legend-label">{domain[0]}</div>
	</div>
	<div class="legend-item">
		<div
			class="legend-color"
			style="background-color: rgb({BOOLEAN_COLOR_SCALE[1][0] +
				',' +
				BOOLEAN_COLOR_SCALE[1][1] +
				',' +
				BOOLEAN_COLOR_SCALE[1][2]})" />
		<div class="legend-label">{domain[1]}</div>
	</div>
{:else}
	{#each domain as d, i}
		<div class="legend-item">
			<div
				class="legend-color"
				style="background-color: rgb({NOMINAL_COLOR_SCALE[i][0] +
					',' +
					NOMINAL_COLOR_SCALE[i][1] +
					',' +
					NOMINAL_COLOR_SCALE[i][2]})" />
			<div class="legend-label">{d}</div>
		</div>
	{/each}
{/if}

<style>
	.legend-item {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
	}
	.legend-color {
		margin-right: 10px;
		min-width: 13px;
		min-height: 13px;
		border-radius: 15px;
	}
	#legend-container {
		display: flex;
		align-items: center;
	}
	#legend {
		width: 40px;
		height: 15px;
		margin-left: 10px;
		margin-right: 10px;
		background-image: linear-gradient(
			to right,
			rgb(0, 0, 256),
			rgb(0, 256, 128)
		);
	}
</style>
