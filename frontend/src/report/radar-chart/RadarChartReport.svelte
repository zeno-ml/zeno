<script lang="ts">
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-radar";

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics;
	$: parameters = currentReport.parameters;

	let chartEntries = [];

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		chartEntries = [];

		rep.slices.forEach((slice) => {
			rep.models.forEach((mod) => {
				chartEntries.push({
					slice: slice.sliceName,
					model: mod,
				});
				metricKeys.push({
					sli: slice,
					metric: rep.metrics,
					model: mod,
				});
			});
		});
		return metricKeys;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<div class="main">
	<div class="model-result">
		{#await modelResults then res}
			{@const chartData = {
				table: chartEntries.map((r, i) => ({
					slices: r.slice,
					models: r.model,
					metrics: res[i].metric.toFixed(2),
				})),
			}}
			<h4>{selectMetrics}</h4>
			<Vega
				spec={generateSpec(parameters)}
				data={chartData}
				options={{ tooltip: true, width: 700, height: 600 }} />
		{/await}
	</div>
</div>

<style>
	.main {
		margin-left: 20px;
	}
	.model-result {
		margin-top: 30px;
	}
	.model-result h4 {
		margin: 0px;
	}
</style>
