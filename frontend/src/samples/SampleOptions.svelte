<script lang="ts">
	import Select, { Option } from "@smui/select";

	import {
		currentColumns,
		sort,
		metric,
		metrics,
		model,
		models,
		transform,
		transforms,
	} from "../stores";

	import SelectionBar from "../metadata/SelectionBar.svelte";
</script>

<div id="options-container">
	<div class="container">
		{#if $models && $models.length > 0}
			<Select bind:value={$model} label="Model" style="margin-right: 20px;">
				{#each $models as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
		{#if $metrics && $metrics.length > 0}
			<Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
		{#if $transforms && $transforms.length > 0}
			<Select
				bind:value={$transform}
				label="Transform"
				style="margin-right: 20px;">
				{#each ["", ...$transforms] as t}
					<Option value={t}>{t}</Option>
				{/each}
			</Select>
		{/if}
	</div>
	<div id="selects">
		<Select
			bind:value={$sort}
			label="Sort By"
			key={(d) => (d && d.name ? d.name : "")}>
			{#each $currentColumns as m}
				<Option value={m}>{m.name}</Option>
			{/each}
		</Select>
	</div>
</div>
<SelectionBar />

<style>
	#options-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 10px;
		margin-bottom: 10px;
		margin-right: 20px;
	}
</style>
