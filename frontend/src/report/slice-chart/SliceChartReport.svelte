<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { getMetricsForSlices } from "../../api";
	import {
		models,
		model,
		reports,
		slices,
		metric,
		metrics,
	} from "../../stores";
	import { VegaLite } from "svelte-vega";
	import generateBarSpec from "./vegaSpec";

	export let reportId: number;

	let chartEntries = [];

	$: report = $reports[reportId];

	function getMetKeys(rep) {
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
					state: {
						metric: $metric,
						model: mod,
						transform: pred.transform,
					},
				});
			});
		});
		return entries;
	}

	$: modelResults = getMetricsForSlices(getMetKeys(report));
</script>

<div style:margin-left="20px">
	<h4
		contenteditable="true"
		style:margin-right="20px"
		style:padding="10px"
		style:width="fit-content"
		bind:textContent={$reports[reportId].name}>
		{report.name}
	</h4>

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
	<div style:margin-top="30px" style:width="500px">
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
