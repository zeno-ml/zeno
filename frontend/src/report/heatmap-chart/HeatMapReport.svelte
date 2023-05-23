<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports, slices } from "../../stores";
	import type { MetricKey, Slice } from "../../zenoservice";
	import generateSpec from "./vegaSpec-heatmap";
	import generateSliceVsSliceSpec from "./vegaSpec-heatmap_slice_vs_slice";

	$: currentReport = $reports[$report];
	$: selectMetric = currentReport.metrics[0];
	$: selectModel = currentReport.models[0];
	$: parameters = currentReport.parameters;

	let chartEntries = [];

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		chartEntries = [];
		// slice vs model
		if (parameters.xEncoding !== parameters.yEncoding) {
			// decide which slice list to use
			let usedslices =
				parameters.xEncoding === "slices"
					? rep.slices
					: rep.parameters.secondSlices;

			usedslices.forEach((slice) => {
				rep.models.forEach((mod) => {
					chartEntries.push({
						slice: slice,
						model: mod,
					});
					metricKeys.push({
						sli: $slices.get(slice),
						metric: selectMetric,
						model: mod,
					});
				});
			});
		}
		// slice vs slice
		else {
			rep.slices.forEach((sli_1) => {
				rep.parameters.secondSlices.forEach((sli_2) => {
					chartEntries.push({
						slice_1: sli_1,
						slice_2: sli_2,
					});

					let sli_1_pred = [...$slices.get(sli_1).filterPredicates.predicates];
					let sli_2_pred = [...$slices.get(sli_2).filterPredicates.predicates];
					let concat_preds = [];

					// if both are not "all instance" slice
					if (sli_1_pred.length !== 0 && sli_2_pred.length !== 0) {
						let sec_slice_pred_col_0 = {
							...$slices.get(sli_2).filterPredicates.predicates[0],
						};
						sec_slice_pred_col_0.join = "&";
						sli_2_pred[0] = sec_slice_pred_col_0;
						concat_preds = sli_1_pred.concat(sli_2_pred);
					} else {
						concat_preds = sli_1_pred.length === 0 ? sli_2_pred : sli_1_pred;
					}

					let combined_slice = <Slice>{
						sliceName: "",
						folder: "",
						filterPredicates: {
							predicates: concat_preds,
							join: "",
						},
					};
					metricKeys.push({
						sli: combined_slice,
						metric: selectMetric,
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
						models: r.model,
						...(selectMetric !== "size" && {
							metrics: res[i].metric.toFixed(2),
						}),
					})),
				}}
				<VegaLite
					spec={generateSpec(parameters, selectMetric)}
					data={chartData}
					options={{
						actions: { source: false, editor: false, compiled: false },
						scaleFactor: {
							png: 3,
						},
					}} />
			{/await}
		{:else}
			{#await modelResults then res}
				{@const chartData = {
					table: chartEntries.map((r, i) => ({
						slice_1: r.slice_1,
						slice_2: r.slice_2,
						size: res[i].size,
						models: r.model,
						...(selectMetric !== "size" && {
							metrics: res[i].metric.toFixed(2),
						}),
					})),
				}}
				<h4>{selectModel}</h4>
				<VegaLite
					spec={generateSliceVsSliceSpec(selectMetric)}
					data={chartData}
					options={{
						actions: { source: false, editor: false, compiled: false },
						scaleFactor: {
							png: 3,
						},
					}} />
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
