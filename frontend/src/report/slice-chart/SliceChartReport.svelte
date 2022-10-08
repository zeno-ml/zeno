<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { getMetricsForSlices } from "../../util/util";
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
	$: report = $reports[reportId];

	$: modelResults = getMetricsForSlices(
		report.reportPredicates.map((pred) => ({
			sli: [...$slices.values()].find((s) => s.sliceName === pred.sliceName),
			metric: $metric,
			model: $model,
			transform: pred.transform,
		}))
	);
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
				table: res.map((r, i) => ({
					slice: report.reportPredicates[i].sliceName,
					metric: r,
				})),
			}}
			<VegaLite
				spec={generateBarSpec($metric, $model)}
				data={chartData}
				options={{ tooltip: true, theme: "vox", width: 1000, height: 300 }} />
		{/await}
	</div>
</div>
