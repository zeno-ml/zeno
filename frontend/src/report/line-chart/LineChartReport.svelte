<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-line";

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics[0];
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
					metric: selectMetrics !== "size" ? selectMetrics : "accuracy",
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
					size: res[i].size,
					metrics: res[i].metric.toFixed(2),
				})),
			}}
			<VegaLite
				spec={generateSpec(parameters, selectMetrics)}
				data={chartData}
				options={{
					tooltip: true,
					width: 1000,
					height: 400,
				}} />
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
</style>
