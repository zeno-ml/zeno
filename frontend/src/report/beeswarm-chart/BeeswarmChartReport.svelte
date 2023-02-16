<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { Vega } from "svelte-vega";
	import { getMetricsForSlices } from "../../api/slice";
	import {
		metric,
		metrics,
		model,
		models,
		reports,
		slices,
	} from "../../stores";
	import type { MetricKey } from "../../zenoservice";
	import generateSpec from "./vegaSpec-beeswarm";
	import { updateTab } from "../../util/util";

	export let reportId: number;

	let chartEntries = [];

	$: report = $reports[reportId];

	function getMetKeys(rep, $metric, $model) {
		const entries: MetricKey[] = [];
		chartEntries = [];
		rep.reportPredicates.forEach((pred) => {
			chartEntries.push({
				slice: pred.sliceName,
				model: $model,
			});
			entries.push({
				sli: [...$slices.values()].find((s) => s.sliceName === pred.sliceName),
				metric: $metric,
				model: $model,
			});
		});
		return entries;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(report, $metric, $model));
</script>

<div class="main">
	<div class="inline">
		<h4
			class="report-link"
			on:keydown={() => ({})}
			on:click={() => {
				updateTab("report");
			}}>
			Reports
		</h4>
		<b>></b>
		<h4
			class="report-name"
			contenteditable="true"
			bind:textContent={$reports[reportId].name}>
			{report.name}
		</h4>
	</div>

	{#if $models && $models.length > 0}
		<Select
			bind:value={$model}
			label="Model"
			style="margin-right: 20px; width: fit-content">
			{#each $models as m}
				<Option value={m}>{m}</Option>
			{/each}
		</Select>
	{/if}
	{#if $metrics && $metrics.length > 0}
		<Select
			bind:value={$metric}
			label="Metric"
			style="margin-right: 20px; width: fit-content">
			{#each $metrics as m}
				<Option value={m}>{m}</Option>
			{/each}
		</Select>
	{/if}
	<br />
	<div class="model-result">
		{#await modelResults then res}
			{@const data = {
				table: chartEntries.map((r, i) => ({
					sli_name: r.slice,
					size: res[i].size,
					metric: res[i].metric.toFixed(2),
				})),
			}}
			<Vega {data} spec={generateSpec($metric)} />
		{/await}
	</div>
</div>

<style>
	.main {
		margin-left: 20px;
	}
	.inline {
		display: flex;
		flex-direction: inline;
		align-items: center;
		max-width: calc(100vw - 450px);
	}
	.report-link {
		padding: 10px 18px 10px 0px;
		width: fit-content;
		cursor: pointer;
	}
	.report-link:hover {
		color: black;
	}
	.report-name {
		margin-left: 5px;
		margin-right: 5px;
		padding: 10px;
		width: fit-content;
	}
	.model-result {
		margin-top: 30px;
		width: 500px;
	}
</style>
