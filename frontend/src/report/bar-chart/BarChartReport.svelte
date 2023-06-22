<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports, slices } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-bar";

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
					slice: slice,
					model: mod,
				});
				metricKeys.push({
					sli: $slices.get(slice),
					metric: selectMetrics,
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
					...(selectMetrics !== "slice size" && {
						metrics: res[i].metric,
					}),
				})),
			}}
			<VegaLite
				spec={generateSpec(parameters, selectMetrics)}
				data={chartData}
				options={{
					actions: { source: false, editor: false, compiled: false },
					width: 1000,
					height: 500,
					scaleFactor: {
						png: 3,
					},
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
