<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import { getMetricsForSlices } from "../../api/slice";
	import type { MetricKey } from "../../zenoservice";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import { slices } from "../../stores";

	export let row: string;
	export let fixed_dimension;
	export let parameters;
	export let currentReport;

	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		if (fixed_dimension === "z") {
			if (parameters.yEncoding === "slices") {
				rep.models.forEach((mod) => {
					metricKeys.push({
						sli: $slices.get(row),
						metric: rep.metrics[0],
						model: mod,
					});
				});
			} else if (parameters.yEncoding === "models") {
				rep.slices.forEach((sli) => {
					metricKeys.push({
						sli: $slices.get(sli),
						metric: rep.metrics[0],
						model: row,
					});
				});
			}
		} else if (fixed_dimension === "y") {
			if (parameters.yEncoding === "slices") {
				rep.models.forEach((mod) => {
					metricKeys.push({
						sli: $slices.get(rep.slices[0]),
						metric: row,
						model: mod,
					});
				});
			} else if (parameters.yEncoding === "models") {
				rep.slices.forEach((sli) => {
					metricKeys.push({
						sli: $slices.get(sli),
						metric: row,
						model: rep.models[0],
					});
				});
			}
		}
		return metricKeys;
	}
</script>

<Row style="overflow: visible">
	{#if fixed_dimension === "z"}
		<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
			<div class="inline">
				{#if parameters.yEncoding === "slices"}
					<SliceDetailsContainer sli={$slices.get(row)} />
				{:else if parameters.yEncoding === "models"}
					{row}
				{/if}
			</div>
		</Cell>
		<Cell>{currentReport.metrics[0]}</Cell>
	{:else if fixed_dimension === "y"}
		<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
			<div class="inline">
				{#if parameters.yEncoding === "slices"}
					<SliceDetailsContainer sli={$slices.get(currentReport.slices[0])} />
				{:else if parameters.yEncoding === "models"}
					{currentReport.models[0]}
				{/if}
			</div>
		</Cell>
		<Cell>{row}</Cell>
	{/if}
	{#await modelResults then res}
		{#if res}
			{#each res as r}
				<Cell>
					<p>
						{row === "size" ||
						(fixed_dimension === "z" && currentReport.metrics[0] === "size")
							? r.size
							: r.metric.toFixed(2)}
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
