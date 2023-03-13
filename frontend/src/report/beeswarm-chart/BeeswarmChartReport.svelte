<script lang="ts">
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-beeswarm";

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics;

	let modelEntries = [];
	let chartEntries = [];

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		let res_index = 0;

		modelEntries = [];
		rep.models.forEach((mod) => {
			chartEntries = [];
			rep.slices.forEach((slice) => {
				chartEntries.push({
					slice: slice.sliceName,
					metric: rep.metrics,
					index: res_index,
				});
				metricKeys.push({
					sli: slice,
					metric: rep.metrics,
					model: mod,
				});
				res_index++;
			});
			modelEntries.push({
				modelName: mod,
				chartData: chartEntries,
			});
		});
		return metricKeys;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<div class="main">
	<div class="model-result">
		{#await modelResults then res}
			{#each modelEntries as { modelName, chartData }}
				{@const data = {
					table: chartData.map((r) => ({
						sli_name: r.slice,
						model: modelName,
						size: res[r.index].size,
						metric: res[r.index].metric.toFixed(2),
					})),
				}}
				<h4>{modelName}</h4>
				<Vega
					spec={generateSpec(selectMetrics)}
					{data}
					options={{
						tooltip: true,
						width: 800,
						height: 100,
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
