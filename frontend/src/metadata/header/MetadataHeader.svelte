<script lang="ts">
	import {
		metric,
		metrics,
		model,
		models,
		comparisonModel,
		tab,
	} from "../../stores";
	import HeaderDropdown from "./HeaderDropdown.svelte";
	$: exludeModels = $models.filter((m) => m !== $model);
</script>

<div id="selections">
	<HeaderDropdown
		title={"Model"}
		placeholder={"Select Model"}
		bind:options={$models}
		bind:value={$model} />
	{#if $tab !== "comparison" && $metric !== undefined}
		<HeaderDropdown
			title={"Metric"}
			placeholder={"Select Metric"}
			bind:options={$metrics}
			bind:value={$metric} />
	{/if}

	{#if $tab === "comparison"}
		<HeaderDropdown
			title={"Model to Compare"}
			placeholder={"Select 2nd Model"}
			bind:options={exludeModels}
			bind:value={$comparisonModel} />
	{/if}
</div>
{#if $tab === "comparison" && $metric !== undefined}
	<HeaderDropdown
		title={"Metric"}
		placeholder={"Select Metric"}
		bind:options={$metrics}
		bind:value={$metric} />
{/if}

<style>
	#selections {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 10px;
		padding-top: 5px;
	}
</style>
