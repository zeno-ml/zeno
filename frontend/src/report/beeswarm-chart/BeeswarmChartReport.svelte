<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { metric, model, models, reports, slices } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-beeswarm";

	export let reportId: number;

	let chartEntries = [];

	$: report = $reports[reportId];

	function getMetKeys(rep, $metric, $model) {
		const entries: MetricKey[] = [];
		chartEntries = [];
		rep.reportPredicates.forEach((pred) => {
			chartEntries.push({
				slice: pred.sliceName,
				model: $model,
			});
			entries.push({
				sli: [...$slices.values()].find((s) => s.sliceName === pred.sliceName),
				metric: $metric,
				model: $model,
			});
		});
		return entries;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(report, $metric, $model));
</script>

<div class="main">
	{#if $models && $models.length > 0}
		<Select
			bind:value={$model}
			label="Model"
			style="margin-right: 20px; width: fit-content">
			{#each $models as m}
				<Option value={m}>{m}</Option>
			{/each}
		</Select>
	{/if}
	<br />
	<div class="model-result">
		{#await modelResults then res}
			{@const data = {
				table: chartEntries.map((r, i) => ({
					sli_name: r.slice,
					size: res[i].size,
					metric: res[i].metric.toFixed(2),
				})),
			}}
			<Vega {data} spec={generateSpec($metric)} />
		{/await}
	</div>
</div>

<style>
	.main {
		margin-left: 20px;
	}
	.model-result {
		margin-top: 30px;
		width: 500px;
	}
</style>
