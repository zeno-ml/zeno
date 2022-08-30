<script lang="ts">
	import {
		metrics,
		models,
		model,
		metric,
		transform,
		transforms,
		sort,
		currentColumns,
	} from "../stores";
	import Select, { Option } from "@smui/select";
</script>

<div id="container">
	<div>
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

<style>
	#container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-left: 20px;
		padding-bottom: 10px;
		border-bottom: 1px solid #e0e0e0;
	}
	#selects {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		margin-right: 20px;
	}
</style>
