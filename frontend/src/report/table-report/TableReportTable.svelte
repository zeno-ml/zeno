<script lang="ts">
	import { report, reports, slices } from "../../stores";
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import TableReportRow from "./TableReportRow.svelte";
	import { getMetricsForSlices } from "../../api/slice";
	import type { MetricKey } from "../../zenoservice";

	$: currentReport = $reports[$report];
	$: selectModels = currentReport.models;
	$: selectMetrics = currentReport.metrics;
	$: selectSlices = currentReport.slices;
	$: parameters = currentReport.parameters;

	function getMetKeys(rep) {
		const metricKeys: MetricKey[] = [];
		// fixed metrics
		if (parameters.zEncoding === "metrics") {
			// x: models, y: slices
			if (parameters.yEncoding === "slices") {
				rep.slices.forEach((sli) => {
					rep.models.forEach((mod) => {
						metricKeys.push({
							sli: $slices.get(sli),
							metric: rep.metrics[0],
							model: mod,
						});
					});
				});
			}
			// x: slices, y: models
			else if (parameters.yEncoding === "models") {
				rep.models.forEach((mod) => {
					rep.slices.forEach((sli) => {
						metricKeys.push({
							sli: $slices.get(sli),
							metric: rep.metrics[0],
							model: mod,
						});
					});
				});
			}
		}
		// fixed slices
		else if (parameters.zEncoding === "slices") {
			// x: metrics, y: models
			rep.models.forEach((mod) => {
				rep.metrics.forEach((met) => {
					metricKeys.push({
						sli: $slices.get(rep.slices[0]),
						metric: met,
						model: mod,
					});
				});
			});
		}
		// fixed models
		else if (parameters.zEncoding === "models") {
			// x: metrics, y: slices
			rep.slices.forEach((sli) => {
				rep.metrics.forEach((met) => {
					metricKeys.push({
						sli: $slices.get(sli),
						metric: met,
						model: rep.models[0],
					});
				});
			});
		}
		return metricKeys;
	}
	$: modelResults = getMetricsForSlices(getMetKeys(currentReport));
</script>

<div id="container">
	<div>
		<DataTable style="max-width: calc(100vw - 450px);">
			<Head>
				<Row>
					<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
						fixed
					</Cell>
					<Cell>{parameters.yEncoding} \ {parameters.xEncoding}</Cell>
					{#if parameters.xEncoding === "slices"}
						{#each selectSlices as slice}
							<Cell style="width: 120px; max-width: 120px; text-align: center;">
								<SliceDetailsContainer sli={$slices.get(slice)} />
							</Cell>
						{/each}
					{:else if parameters.xEncoding === "models"}
						{#each selectModels as m}
							<Cell style="width: 120px; max-width: 120px; text-align: center;">
								{m}
							</Cell>
						{/each}
					{:else if parameters.xEncoding === "metrics"}
						{#each selectMetrics as m}
							<Cell style="width: 120px; max-width: 120px; text-align: center;">
								{m}
							</Cell>
						{/each}
					{/if}
				</Row>
			</Head>
			<Body style="overflow: visible">
				{#await modelResults then res}
					{#if parameters.yEncoding === "slices"}
						{@const resultSize = res.length / selectSlices.length}
						{#each selectSlices as slice, i}
							<TableReportRow
								result={res.slice(resultSize * i, resultSize * (i + 1))}
								yCell={slice}
								{parameters}
								{currentReport} />
						{/each}
					{:else if parameters.yEncoding === "models"}
						{@const resultSize = res.length / selectModels.length}
						{#each selectModels as model, i}
							<TableReportRow
								result={res.slice(resultSize * i, resultSize * (i + 1))}
								yCell={model}
								{parameters}
								{currentReport} />
						{/each}
					{/if}
				{/await}
			</Body>
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
		margin-top: 20px;
	}
</style>
