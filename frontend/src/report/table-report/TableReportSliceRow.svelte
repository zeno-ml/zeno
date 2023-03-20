<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import { getMetricsForSlices } from "../../api/slice";
	import { report, reports } from "../../stores";
	import type { Slice, MetricKey } from "../../zenoservice";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";

	export let slice: Slice;

	$: currentReport = $reports[$report];
	$: selectMetrics = currentReport.metrics;

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		rep.models.forEach((mod) => {
			metricKeys.push({
				sli: slice,
				metric: rep.metrics,
				model: mod,
			});
		});
		return metricKeys;
	}
</script>

<Row style="overflow: visible">
	<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
		<div class="inline">
			{#if slice}
				<SliceDetailsContainer sli={slice} />
			{/if}
		</div>
	</Cell>
	<Cell>{selectMetrics}</Cell>
	{#await modelResults then res}
		{#if res}
			{#each res as r}
				<Cell>
					<p>
						{r.metric.toFixed(2)}
					</p>
				</Cell>
			{/each}
		{/if}
	{/await}
</Row>

<style>
	.inline {
		display: flex;
		align-items: center;
	}
	:global(.sticky) {
		overflow: visible;
		left: 0px;
		background: var(--G6);
		z-index: 0;
	}
</style>
