<script lang="ts">
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-beeswarm";

	$: currentReport = $reports[$report];
	$: parameters = currentReport.parameters;
	$: fixed_dimension = currentReport.parameters.fixedDimension;

	let yEntries = [];
	let chartEntries = [];

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		let res_index = 0;
		yEntries = [];
		if (fixed_dimension === "x") {
			if (parameters.yEncoding === "models") {
				rep.models.forEach((mod) => {
					chartEntries = [];
					rep.slices.forEach((slice) => {
						chartEntries.push({
							slice: slice.sliceName,
							metric: rep.metrics[0],
							index: res_index,
						});
						metricKeys.push({
							sli: slice,
							metric: rep.metrics[0],
							model: mod,
						});
						res_index++;
					});
					yEntries.push({
						yName: mod,
						chartData: chartEntries,
						xLabel: rep.metrics[0],
					});
				});
			} else if (parameters.yEncoding === "slices") {
				rep.slices.forEach((slice) => {
					chartEntries = [];
					rep.models.forEach((mod) => {
						chartEntries.push({
							model: mod,
							metric: rep.metrics[0],
							index: res_index,
						});
						metricKeys.push({
							sli: slice,
							metric: rep.metrics[0],
							model: mod,
						});
						res_index++;
					});
					yEntries.push({
						yName: slice.sliceName,
						chartData: chartEntries,
						xLabel: rep.metrics[0],
					});
				});
			}
		} else if (fixed_dimension === "y") {
			if (parameters.yEncoding === "models") {
				rep.metrics.forEach((metric) => {
					chartEntries = [];
					rep.slices.forEach((slice) => {
						chartEntries.push({
							slice: slice.sliceName,
							metric: rep.metrics[0],
							index: res_index,
						});
						metricKeys.push({
							sli: slice,
							metric: metric,
							model: rep.models[0],
						});
						res_index++;
					});
					yEntries.push({
						yName: rep.models[0],
						chartData: chartEntries,
						xLabel: metric,
					});
				});
			} else if (parameters.yEncoding === "slices") {
				rep.metrics.forEach((metric) => {
					chartEntries = [];
					rep.models.forEach((mod) => {
						chartEntries.push({
							model: mod,
							metric: rep.metrics[0],
							index: res_index,
						});
						metricKeys.push({
							sli: rep.slices[0],
							metric: metric,
							model: mod,
						});
						res_index++;
					});
					yEntries.push({
						yName: rep.slices[0].sliceName,
						chartData: chartEntries,
						xLabel: metric,
					});
				});
			}
		}
		return metricKeys;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<div class="main">
	<div class="model-result">
		{#await modelResults then res}
			{#each yEntries as { yName, chartData, xLabel }}
				{@const data = {
					table: chartData.map((r) => ({
						slices: parameters.yEncoding === "slices" ? yName : r.slice,
						models: parameters.yEncoding === "models" ? yName : r.model,
						size: res[r.index].size,
						metrics: res[r.index].metric.toFixed(2),
					})),
				}}
				<h4>{yName}</h4>
				<Vega
					spec={generateSpec(parameters, xLabel)}
					{data}
					options={{
						actions: { source: false, editor: false, compiled: false },
						width: 800,
						height: 100,
						scaleFactor: {
							png: 3,
						},
					}} />
			{/each}
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
		margin: 0px 0px 10px 0px;
	}
</style>
