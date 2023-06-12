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
		<div style="margin-right: 10px;">
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
		<div>
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
	<div>
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
		font-size: 14px;
		color: var(--G1);
	}
	option {
		padding: 5px;
	}
	option:checked {
		background-color: var(--G5);
	}
	.options-header {
		margin-top: 5px;
		margin-bottom: 5px;
		color: var(--G2);
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
