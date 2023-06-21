<script lang="ts">
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports, slices } from "../../stores";
	import { type MetricKey, type Report } from "../../zenoservice";
	import { generateSpec } from "./vegaSpec-radar";

	$: currentReport = $reports[$report];
	$: parameters = currentReport.parameters;

	let chartEntries = [];
	let fixedName = "";

	function getMetKeys(rep: Report) {
		const metricKeys: MetricKey[] = [];
		chartEntries = [];

		if (parameters.xEncoding === "metrics") {
			if (parameters.yEncoding === "slices") {
				fixedName = rep.models[0];
				rep.metrics.forEach((metric) => {
					rep.slices.forEach((slice) => {
						chartEntries.push({
							key: metric,
							category: slice,
						});
						metricKeys.push({
							sli: $slices.get(slice),
							metric: metric,
							model: rep.models[0],
						});
					});
				});
			} else if (parameters.yEncoding === "models") {
				fixedName = rep.slices[0];
				rep.metrics.forEach((metric) => {
					rep.models.forEach((mod) => {
						chartEntries.push({
							key: metric,
							category: mod,
						});
						metricKeys.push({
							sli: $slices.get(rep.slices[0]),
							metric: metric,
							model: mod,
						});
					});
				});
			}
		} else if (parameters.zEncoding === "metrics") {
			fixedName = rep.metrics[0];
			if (parameters.yEncoding === "slices") {
				rep.models.forEach((mod) => {
					rep.slices.forEach((slice) => {
						chartEntries.push({
							key: mod,
							category: slice,
						});
						metricKeys.push({
							sli: $slices.get(slice),
							metric: rep.metrics[0],
							model: mod,
						});
					});
				});
			} else if (parameters.yEncoding === "models") {
				rep.models.forEach((mod) => {
					rep.slices.forEach((slice) => {
						chartEntries.push({
							key: slice,
							category: mod,
						});
						metricKeys.push({
							sli: $slices.get(slice),
							metric: rep.metrics[0],
							model: mod,
						});
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
			{@const chartData = {
				table: chartEntries.map((r, i) => ({
					key: r.key,
					value:
						r.key === "slice size" || fixedName === "slice size"
							? res[i].size
							: res[i].metric,
					category: r.category,
				})),
			}}
			<h4>{fixedName}</h4>
			<Vega
				spec={generateSpec}
				data={chartData}
				options={{
					actions: { source: false, editor: false, compiled: false },
					width: 800,
					height: 700,
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
	.model-result h4 {
		margin: 0px;
	}
</style>
