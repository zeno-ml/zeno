<script lang="ts">
	import { VegaLite } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import { metric, models, report, reports, slices } from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateBarSpec from "./vegaSpec";

	let chartEntries = [];

	$: currReport = $reports[$report];

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

	$: modelResults = getMetricsForSlices(getMetKeys(currReport, $metric));
</script>

<div class="main">
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
