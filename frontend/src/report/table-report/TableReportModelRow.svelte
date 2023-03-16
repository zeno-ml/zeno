<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { MetricKey } from "../../zenoservice";

	export let model: string;

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics;

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		rep.slices.forEach((slice) => {
			metricKeys.push({
				sli: slice,
				metric: rep.metrics,
				model: model,
			});
		});
		return metricKeys;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<Row style="overflow: visible">
	<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
		{model}
	</Cell>
	<Cell>{selectMetrics}</Cell>
	{#if modelResults}
		{#await modelResults then res}
			{#each res as r}
				<Cell>
					<p>
						{r.metric.toFixed(2)}
					</p>
				</Cell>
			{/each}
		{/await}
	{/if}
</Row>

<style>
	:global(.sticky) {
		overflow: visible;
		left: 0px;
		background: var(--G6);
		z-index: 0;
	}
</style>
