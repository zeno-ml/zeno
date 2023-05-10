<script lang="ts">
	import {
		metric,
		metrics,
		model,
		models,
		comparisonModels,
		tab,
	} from "../../stores";
	import MetadataComp from "./HeaderDropdown.svelte";
	$: exludeModels = $models.filter((m) => m !== $model);
</script>

<div id="selections">
	<MetadataComp
		title={"Model"}
		placeholder={"Select Model"}
		bind:options={$models}
		bind:value={$model} />
	{#if $tab !== "comparison" && $metric !== undefined}
		<MetadataComp
			title={"Metric"}
			placeholder={"Select Metric"}
			bind:options={$metrics}
			bind:value={$metric} />
	{/if}

	{#if $tab === "comparison"}
		<MetadataComp
			title={"Model to Compare"}
			placeholder={"Select 2nd Model"}
			bind:options={exludeModels}
			bind:value={$comparisonModels[0]} />
	{/if}
</div>
{#if $tab === "comparison" && $metric !== undefined}
	<MetadataComp
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
