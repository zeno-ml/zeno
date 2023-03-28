<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey, Slice } from "../../zenoservice";
	import generateSpec from "./vegaSpec-heatmap";
	import generateSliceVsSliceSpec from "./vegaSpec-heatmap_slice_vs_slice";

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics[0];
	$: parameters = currentReport.parameters;

	let chartEntries = [];

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		chartEntries = [];
		// slice vs model
		if (parameters.xEncoding !== parameters.yEncoding) {
			rep.slices.forEach((slice) => {
				rep.models.forEach((mod) => {
					chartEntries.push({
						slice: slice.sliceName,
						model: mod,
					});
					metricKeys.push({
						sli: slice,
						metric: selectMetrics,
						model: mod,
					});
				});
			});
		}
		// slice vs slice
		else {
			let selectModel = rep.models[0];
			rep.slices.forEach((sli_1) => {
				rep.slices.forEach((sli_2) => {
					chartEntries.push({
						slice_1: sli_1.sliceName,
						slice_2: sli_2.sliceName,
					});
					let first_slice_pred = { ...sli_1.filterPredicates.predicates[0] };
					let sec_slice_pred = { ...sli_2.filterPredicates.predicates[0] };
					sec_slice_pred.join = "&";
					let combined_slice = <Slice>{
						sliceName: "",
						folder: "",
						filterPredicates: {
							predicates: [first_slice_pred, sec_slice_pred],
							join: "",
						},
					};
					metricKeys.push({
						sli: combined_slice,
						metric: selectMetrics,
						model: selectModel,
					});
				});
			});
		}
		return metricKeys;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<div class="main">
	<div class="model-result">
		{#if parameters.xEncoding !== parameters.yEncoding}
			{#await modelResults then res}
				{@const chartData = {
					table: chartEntries.map((r, i) => ({
						slices: r.slice,
						size: res[i].size,
						metrics: res[i].metric.toFixed(2),
						models: r.model,
					})),
				}}
				<VegaLite
					spec={generateSpec(parameters, selectMetrics)}
					data={chartData}
					options={{ tooltip: true }} />
			{/await}
		{:else}
			{#await modelResults then res}
				{@const chartData = {
					table: chartEntries.map((r, i) => ({
						slice_1: r.slice_1,
						slice_2: r.slice_2,
						size: res[i].size,
						metrics: res[i].metric.toFixed(2),
						models: r.model,
					})),
				}}
				<VegaLite
					spec={generateSliceVsSliceSpec(selectMetrics)}
					data={chartData}
					options={{ tooltip: true }} />
			{/await}
		{/if}
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
