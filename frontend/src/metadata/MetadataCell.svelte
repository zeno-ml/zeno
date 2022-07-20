<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { View } from "svelte-vega";

	import Button from "@smui/button";
	import { Label } from "@smui/common";

	import { VegaLite } from "svelte-vega";
	import { onMount } from "svelte";

	import {
		metadataSelections,
		table,
		settings,
		availableColors,
		colorByHash,
		filteredTable,
	} from "../stores";
	import { columnHash } from "../util";
	import {
		generateCountSpec,
		generateHistogramSpec,
		countSpec,
		histogramSpec,
		histogramSpecNotColored,
	} from "./vegaSpecs";
	import * as aq from "arquero";
	import * as d3c from "d3-scale-chromatic";
	import { interpolateColorToArray } from "../discovery/discovery";
	import { computeCountsFromDomain, computeDomain } from "./metadata";

	export let col: ZenoColumn;
	export let shouldColor: boolean = false;

	$: hash = columnHash(col);

	enum ChartType {
		Count,
		Histogram,
		Binary,
		Other,
	}
	let chartType: ChartType;
	let domain: object[];

	interface IColorAssignments {
		colors: string[];
		labels: { id: string; colorIndex: number }[];
		hash: string;
	}
	interface IBin {
		binStart: number;
		binEnd: number;
		count?: number;
		filteredCount?: number;
	}
	let selection = undefined;
	let finalSelection = undefined;
	let view: View;
	let data = { table: [] };
	let histoData = { table: [] };
	let bins: IBin[] = [];

	let colorAssignments: IColorAssignments = { colors: [], labels: [], hash };

	function updateData(table: ColumnTable, filteredTable: ColumnTable) {
		if (
			(chartType === ChartType.Count || chartType === ChartType.Histogram) &&
			table.column(hash)
		) {
			const counts = computeCountsFromDomain({
				table: filteredTable,
				domain,
				column: hash,
			});
			if (chartType === ChartType.Count) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i].count,
					count: d["count"],
					category: d["category"],
				}));
			} else if (chartType === ChartType.Histogram) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i].count,
					count: d["count"],
					binStart: d["binStart"],
					binEnd: d["binEnd"],
				}));
			}
			console.log(domain);
			histoData = { table: domain };
		}
	}

	function drawChart(t: ColumnTable) {
		if (t.column(hash)) {
			let isOrdinal = isNaN(Number(t.column(hash).get(0)));
			let unique = t
				.rollup({ unique: `d => op.distinct(d["${hash}"])` })
				.object()["unique"];

			if (!isOrdinal && unique === 2) {
				let vals = t
					.orderby(hash)
					.rollup({ a: `d => op.array_agg_distinct(d["${hash}"])` })
					.object()["a"];
				if (Number(vals[0]) === 0 && Number(vals[1]) === 1) {
					chartType = ChartType.Binary;
					colorAssignments = colorLabelCategorical({
						hash,
						colorRange: ["#040265", "#FD9A03"],
					});

					$availableColors = { ...$availableColors, [hash]: colorAssignments };
				}
			} else if (isOrdinal) {
				if (unique <= 20) {
					chartType = ChartType.Count;
					colorAssignments = colorLabelCategorical({ hash });

					$availableColors = { ...$availableColors, [hash]: colorAssignments };
				} else {
					chartType = ChartType.Other;
				}
			} else {
				if (unique < 20) {
					chartType = ChartType.Count;
				} else {
					chartType = ChartType.Histogram;
					colorAssignments = colorLabelContin(hash);

					$availableColors = { ...$availableColors, [hash]: colorAssignments };
				}
			}

			domain = computeDomain({
				type: chartType,
				table: $table,
				column: hash,
			});
			domain.forEach((d) => (d["filteredCount"] = d["count"]));
		}
	}

	function colorLabelContin(columnName: string, t = $table) {
		let colorArray = interpolateColorToArray(
			d3c.interpolatePurples,
			bins.length
		);
		let colorLabels = [];
		for (const row of t) {
			let i = 0;
			for (const bin of bins) {
				if (row[columnName] >= bin.binStart && row[columnName] < bin.binEnd) {
					colorLabels.push({
						id: row[columnHash($settings.idColumn)],
						colorIndex: i,
					});
					break;
				}
				i++;
			}
		}
		return {
			colors: colorArray,
			labels: colorLabels,
			hash,
		} as IColorAssignments;
	}

	function colorLabelCategorical({
		hash,
		t = $table,
		colorRange = d3c.schemeCategory10 as string[],
	}: {
		hash: string;
		t?: ColumnTable;
		colorRange?: string[];
	}) {
		let vals = t
			.orderby(hash)
			.rollup({ a: `d => op.array_agg_distinct(d["${hash}"])` })
			.object()["a"];
		let mapper = new Map();
		for (let i = 0; i < vals.length; i++) {
			mapper.set(vals[i], i);
		}
		let colorLabels = [];
		for (const row of t) {
			colorLabels.push({
				id: row[columnHash($settings.idColumn)],
				colorIndex: mapper.get(row[hash]),
			});
		}
		return {
			colors: colorRange,
			labels: colorLabels,
			hash,
		} as IColorAssignments;
	}

	table.subscribe((t) => drawChart(t));
	onMount(() => {
		drawChart($table);
		updateData($table, $filteredTable);
	});

	$: {
		col;
		updateData($table, $filteredTable);
	}

	metadataSelections.subscribe((m) => {
		if (!m.has(hash) && view) {
			if (view.getState().signals["brush_x"]) {
				view.signal("brush", {});
				if (view.getState().signals["brush_data"]) {
					view.signal("brush_data", {});
				}
				view.signal("brush_x", []);
				view.runAsync();
			}
			if (view.getState().signals["select_tuple"]) {
				view.signal("select", {});
				view.signal("select_modify", undefined);
				view.signal("select_toggle", false);
				view.signal("select_tuple", undefined);
				view.signal("highlight", {});
				view.signal("highlight_modify", undefined);
				view.signal("highlight_toggle", false);
				view.signal("highlight_tuple", undefined);
				view.runAsync();
			}
		}
	});

	$: if (view) {
		if (chartType === ChartType.Histogram) {
			view.addSignalListener("brush", (...s) => {
				return (selection = s[1].binStart
					? ["range", ...s[1].binStart]
					: undefined);
			});
		} else if (chartType === ChartType.Count) {
			view.addSignalListener(
				"select",
				(...s) =>
					(selection = s[1].category ? ["points", ...s[1].category] : undefined)
			);
		}
	}
	$: selectedHash = $colorByHash === hash;

	function setSelection() {
		if (selection === finalSelection) {
			return;
		}

		finalSelection = selection;
		metadataSelections.update((m) => {
			if (!finalSelection) {
				m.delete(hash);
				return m;
			}
			m.set(hash, {
				column: col,
				type: finalSelection[0],
				values: finalSelection.slice(1),
			});
			return m;
		});
	}
</script>

<div class="cell">
	<div id="info">
		<span
			style:color={selectedHash ? "#9B52DF" : ""}
			on:click={() => {
				colorByHash.set(hash);
			}}>{col.name}</span>
		{#if chartType === ChartType.Binary}
			<div style:display="flex">
				<div class="binary-button">
					<Button
						variant="outlined"
						on:click={() => {
							selection =
								selection && selection[1] === "is"
									? undefined
									: ["binary", "is"];
							setSelection();
						}}>
						<Label
							style="color: {selectedHash ? colorAssignments.colors[1] : ''};"
							>Is</Label>
					</Button>
					{$table.filter(`d => d["${hash}"] == 1`).count().object()["count"]}
				</div>
				<div class="binary-button">
					<Button
						variant="outlined"
						on:click={() => {
							selection =
								selection && selection[1] === "is not"
									? undefined
									: ["binary", "is not"];
							setSelection();
						}}>
						<Label
							style="color: {selectedHash ? colorAssignments.colors[0] : ''};"
							>Is Not</Label>
					</Button>
					{$table.filter(`d => d["${hash}"] == 0`).count().object()["count"]}
				</div>
			</div>
		{/if}
		{#if selection && selection[0] === "range"}
			<span>
				{selection ? selection[1].toFixed(2) + " - " : ""}
				{selection ? selection[2].toFixed(2) : ""}
			</span>
		{/if}
		{#if $table.column(hash) && chartType === ChartType.Other}
			<span style:margin-right="5px">
				unique values: {$table
					.rollup({ unique: `d => op.distinct(d["${hash}"])` })
					.object()["unique"]}
			</span>
		{/if}
	</div>
	{#if (data.table.length > 0 || histoData.table.length > 0) && (chartType === ChartType.Histogram || chartType === ChartType.Count)}
		<div
			id="histogram"
			on:mouseup={setSelection}
			on:mouseout={setSelection}
			on:click={setSelection}
			on:blur={setSelection}>
			<VegaLite
				spec={chartType === ChartType.Histogram
					? generateHistogramSpec()
					: generateCountSpec()}
				data={histoData}
				bind:view
				options={{ tooltip: true, actions: false, theme: "vox" }} />
		</div>
	{/if}
</div>

<style>
	.cell {
		/* border: 1px solid #e0e0e0; */
		border-top: 1px solid #e0e0e0;
		border-bottom: 1px solid #e0e0e0;
		padding: 10px;
		min-width: 400px;
		width: fit-content;
		display: flex;
		flex-direction: column;
	}
	#info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		font-size: 14px;
		margin-left: 5px;
		margin-bottom: 5px;
		color: #666;
	}
	.binary-button {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
