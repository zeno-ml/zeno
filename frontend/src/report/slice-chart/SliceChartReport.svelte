<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateBarSpec from "./vegaSpec";

	$: currentReport = $reports[$report];
	let chartEntries = [];
	let selectedModels = [];
	let selectMetrics = "";
	let selectSlices = [];
	let parameters = {};

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		chartEntries = [];
		selectedModels = rep.models;
		selectMetrics = rep.metrics;
		selectSlices = rep.slices;
		parameters = rep.parameters;

		selectSlices.forEach((slice) => {
			selectedModels.forEach((mod) => {
				chartEntries.push({
					slice: slice.sliceName,
					model: mod,
					metric: selectMetrics,
				});
				metricKeys.push({
					sli: slice,
					metric: <string>selectMetrics,
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
					metrics: res[i].metric,
				})),
			}}
			<VegaLite
				spec={generateBarSpec(parameters, selectMetrics)}
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
