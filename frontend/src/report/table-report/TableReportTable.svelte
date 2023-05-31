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
	$: sortCol = [-1, true];

	let xCells = [];
	let yCells = [];

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

	function sortByCol(resMap, sortCol) {
		if (sortCol[0] >= 0) {
			let sortResult = new Map(
				Object.entries(resMap).sort((a, b) => {
					if (a[1][sortCol[0]].metric) {
						return sortCol[1]
							? a[1][sortCol[0]].metric - b[1][sortCol[0]].metric
							: b[1][sortCol[0]].metric - a[1][sortCol[0]].metric;
					} else {
						return sortCol[1]
							? a[1][sortCol[0]].size - b[1][sortCol[0]].size
							: b[1][sortCol[0]].size - a[1][sortCol[0]].size;
					}
				})
			);
			if (parameters.yEncoding === "models") {
				$reports[$report].models = Array.from(sortResult.keys());
			} else {
				$reports[$report].slices = Array.from(sortResult.keys());
			}
		}
	}

	async function getResultMap(rep) {
		let fetchResult;
		let resMap = {};

		await getMetricsForSlices(getMetKeys(rep)).then(
			(res) => (fetchResult = res)
		);
		const rowSize = fetchResult.length / yCells.length;
		yCells.forEach((y, i) => {
			resMap[y] = fetchResult.slice(rowSize * i, rowSize * (i + 1));
		});

		return resMap;
	}

	$: modelResultMap = getResultMap(currentReport);
</script>

<div id="container">
	<div>
		{#await modelResultMap then res}
			<DataTable style="max-width: calc(100vw - 450px);">
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							fixed
						</Cell>
						<Cell>{parameters.yEncoding} \ {parameters.xEncoding}</Cell>
						{#each xCells as xCell, i}
							<Cell
								style="width: 140px; max-width: 140px; cursor: pointer;"
								on:keydown={() => ({})}
								on:click={() => {
									if (sortCol[0] !== i) {
										sortCol = [i, true];
									} else if (sortCol[0] === i && sortCol[1]) {
										sortCol = [i, false];
									} else {
										sortCol = [-1, true];
									}
									sortByCol(res, sortCol);
								}}>
								<div style="display: flex;">
									<div style="margin:auto;overflow: hidden">
										{#if parameters.xEncoding === "slices"}
											<SliceDetailsContainer sli={$slices.get(xCell)} />
										{:else}
											{xCell}
										{/if}
									</div>
									<Icon class="material-icons" style="font-size: 25px;">
										{#if sortCol[0] === i && sortCol[1]}
											arrow_drop_up
										{:else if sortCol[0] === i}
											arrow_drop_down
										{/if}
									</Icon>
								</div>
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
