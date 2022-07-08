<script lang="ts">
	import Select, { Option } from "@smui/select";

	import {
		currentColumns,
		filteredTable,
		sort,
		metric,
		metrics,
		model,
		models,
		transform,
		transforms,
	} from "../stores";
	import { columnHash } from "../util";

	import SelectionBar from "../metadata/SelectionBar.svelte";

	sort.subscribe((s) => {
		filteredTable.update((table) => {
			if (table && s) {
				return table.orderby(columnHash(s));
			}
			return table;
		});
	});
</script>

<div id="options-container">
	<div class="options container">
		{#if $models}
			<Select bind:value={$model} label="Model" style="margin-right: 20px;">
				{#each $models as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
		{#if $metrics}
			<Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
		{#if $transforms}
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
		<div class="select-div">
			<Select bind:value={$sort} label="Sort By">
				{#each $currentColumns as m}
					<Option value={m}>{m.name}</Option>
				{/each}
			</Select>
		</div>
	</div>
</div>
<SelectionBar />

<style>
	#selects {
		display: flex;
		flex-direction: inline;
	}
	#options-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgb(224, 224, 224);
		margin-bottom: 10px;
		padding-bottom: 10px;
		margin-right: 20px;
	}
	.options {
		align-items: center;
		justify-content: space-between;
	}
	.select-div {
		margin-left: 20px;
	}
</style>
