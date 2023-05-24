<script lang="ts">
	import {
		metric,
		metrics,
		model,
		models,
		comparisonModel,
		tab,
	} from "../stores";
	$: exludeModels = $models.filter((m) => m !== $model);
</script>

<div id="selections">
	{#if $model !== undefined}
		<div style="z-index: 6; margin-right: 10px;">
			<div class="options-header">
				{$tab === "comparison" ? "Model A" : "Model"}
			</div>
			<select bind:value={$model}>
				{#each $models as mod}
					<option value={mod}>{mod}</option>
				{/each}
			</select>
		</div>
	{/if}
	{#if $tab !== "comparison" && $metric !== undefined}
		<div>
			<div class="options-header">Metric</div>
			<select bind:value={$metric}>
				{#each $metrics as met}
					<option value={met}>{met}</option>
				{/each}
			</select>
		</div>
	{/if}
	{#if $tab === "comparison"}
		<div style="z-index: 6;">
			<div class="options-header">Model B</div>
			<select bind:value={$comparisonModel}>
				{#each exludeModels as mod}
					<option value={mod}>{mod}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
{#if $tab === "comparison" && $metric !== undefined}
	<div style="z-index: 5">
		<div class="options-header">Metric</div>
		<select style="width: 345px" bind:value={$metric}>
			{#each $metrics as met}
				<option value={met}>{met}</option>
			{/each}
		</select>
	</div>
{/if}

<style>
	select {
		width: 167px;
		height: 35px;
		border: 1px solid var(--G4);
		border-radius: 5px;
	}
	#selections {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 10px;
		padding-top: 5px;
	}
	.options-header {
		margin-top: 5px;
		margin-bottom: 5px;
		color: var(--G2);
	}
</style>
