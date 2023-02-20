<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { metric, metrics, models, reports, slices } from "../../stores";
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

<div class="main">
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
	<div class="model-result">
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

<style>
	.main {
		margin-left: 20px;
	}
	.model-result {
		margin-top: 30px;
		width: 500px;
	}
</style>
