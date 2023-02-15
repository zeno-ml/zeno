<script lang="ts">
	import Select, { Option } from "@smui/select";
	import type { VisualizationSpec } from "svelte-vega";
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import {
		metric,
		metrics,
		model,
		models,
		reports,
		slices,
	} from "../../stores";
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

<div style:margin-left="20px">
	<h4
		contenteditable="true"
		style:margin-right="20px"
		style:padding="10px"
		style:width="fit-content"
		bind:textContent={$reports[reportId].name}>
		{report.name}
	</h4>

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
	{#if $metrics && $metrics.length > 0}
		<Select
			bind:value={$metric}
			label="Metric"
			style="margin-right: 20px; width: fit-content">
			{#each $metrics as m}
				<Option value={m}>{m}</Option>
			{/each}
		</Select>
	{/if}
	<br />
	<div style:margin-top="30px" style:width="500px">
		{#await modelResults then res}
			{@const data = {
				table: chartEntries.map((r, i) => ({
					name: r.slice,
					size: res[i].size,
					group: res[i].metric,
				})),
			}}
			<Vega {data} spec={generateSpec($metric)} />
		{/await}
	</div>
</div>
