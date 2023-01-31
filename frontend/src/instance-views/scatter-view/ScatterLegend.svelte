<script lang="ts">
	import {
		BOOLEAN_COLOR_SCALE,
		NOMINAL_COLOR_SCALE,
		CONTINUOUS_COLOR_SCALE,
	} from "./regl-scatter/colors";

	export let domain: (string | number)[] = [];
	export let metadataType = "";
</script>

{#if metadataType === "continuous"}
	{@const svg = { width: 100, height: 14 }}
	<div id="legend-container">
		<span>
			{typeof domain[0] === "number" ? domain[0].toFixed(2) : domain[0]}
		</span>
		<svg
			height={svg.height}
			width={svg.width}
			style="border: 0.5px solid var(--G5); margin: 10px;">
			{#each CONTINUOUS_COLOR_SCALE as color, i}
				{@const spacing = svg.width / CONTINUOUS_COLOR_SCALE.length}
				{@const colorWidth = (1 / CONTINUOUS_COLOR_SCALE.length) * svg.width}
				<rect
					x={i * spacing}
					y={0}
					height={svg.height}
					width={colorWidth}
					fill={color} />
			{/each}
		</svg>
		<span>
			{typeof domain[1] === "number" ? domain[1].toFixed(2) : domain[0]}
		</span>
	</div>
{:else if metadataType === "boolean"}
	<div class="legend-item">
		<div
			class="legend-color"
			style="background-color: {BOOLEAN_COLOR_SCALE[1]}" />
		<div class="legend-label">TRUE</div>
	</div>
	<div class="legend-item">
		<div
			class="legend-color"
			style="background-color: {BOOLEAN_COLOR_SCALE[0]}" />
		<div class="legend-label">FALSE</div>
	</div>
{:else if metadataType === "nominal"}
	{#each domain.sort() as d, i}
		<div class="legend-item">
			<div
				class="legend-color"
				style="background-color: {NOMINAL_COLOR_SCALE[i]}" />
			<div class="legend-label">{d}</div>
		</div>
	{/each}
{:else}
	<p>Too many nominal values</p>
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
</style>
