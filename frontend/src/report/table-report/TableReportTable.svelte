<script lang="ts">
	import { Icon } from "@smui/button";
	import { report, reports, slices } from "../../stores";
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import TableReportRow from "./TableReportRow.svelte";
	import { getMetricsForSlices } from "../../api/slice";
	import type { MetricKey } from "../../zenoservice";

	$: currentReport = $reports[$report];
	$: parameters = currentReport.parameters;

	let xCells = [];
	let yCells = [];
	$: sortCol = [];

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
				xCells = Object.assign([], rep.models);
				yCells = Object.assign([], rep.slices);
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
				xCells = Object.assign([], rep.slices);
				yCells = Object.assign([], rep.models);
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
			xCells = Object.assign([], rep.metrics);
			yCells = Object.assign([], rep.models);
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
			xCells = Object.assign([], rep.metrics);
			yCells = Object.assign([], rep.slices);
		}
		return metricKeys;
	}

	async function getSortResult(currentReport) {
		let fetchResult;
		let sortResult = {};
		await getMetricsForSlices(getMetKeys(currentReport)).then(
			(res) => (fetchResult = res)
		);
		const resultSize = fetchResult.length / yCells.length;
		yCells.forEach((y, i) => {
			sortResult[y] = fetchResult.slice(resultSize * i, resultSize * (i + 1));
		});
		console.log(
			new Map(
				Object.entries(sortResult).sort(
					(a, b) => b[1][0].metric - a[1][0].metric
				)
			)
		);
		return sortResult;
	}

	$: sortResult = getSortResult(currentReport);
</script>

<div id="container">
	<div>
		{#await sortResult then res}
			<DataTable style="max-width: calc(100vw - 450px);">
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							fixed
						</Cell>
						<Cell>{parameters.yEncoding} \ {parameters.xEncoding}</Cell>
						{#each xCells as xCell}
							<Cell style="width: 120px; max-width: 120px; text-align: center;">
								{#if parameters.xEncoding === "slices"}
									<SliceDetailsContainer sli={$slices.get(xCell)} />
								{:else}
									{xCell}
								{/if}
							</Cell>
						{/each}
					</Row>
				</Head>
				<Body style="overflow: visible">
					{#each yCells as yCell}
						<TableReportRow
							result={res[yCell]}
							{yCell}
							{parameters}
							{currentReport} />
					{/each}
				</Body>
			</DataTable>
		{/await}
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
		margin-top: 20px;
	}
</style>
