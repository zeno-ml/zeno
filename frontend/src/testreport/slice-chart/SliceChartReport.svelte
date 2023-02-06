<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { VegaLite } from "svelte-vega";
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
	import generateBarSpec from "./vegaSpec";

	export let reportId: number;

	let chartEntries = [];

	$: report = $reports[reportId];

	function getMetKeys(rep, $metric) {
		const entries: MetricKey[] = [];
		chartEntries = [];
		rep.reportPredicates.forEach((pred) => {
			$models.forEach((mod) => {
				chartEntries.push({
					slice: pred.sliceName,
					model: mod,
				});
				entries.push({
					sli: [...$slices.values()].find(
						(s) => s.sliceName === pred.sliceName
					),
					metric: $metric,
					model: mod,
				});
			});
		});
		return entries;
	}
	
	$: modelResults = getMetricsForSlices(getMetKeys(report, $metric));
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
			{@const chartData = {
				table: chartEntries.map((r, i) => ({
					slice: r.slice,
					model: r.model,
					metric: res[i].metric,
				})),
			}}
			<VegaLite
				spec={generateBarSpec($metric)}
				data={chartData}
				options={{ tooltip: true, theme: "vox", width: 1000, height: 300 }} />
		{/await}
	</div>
</div>
