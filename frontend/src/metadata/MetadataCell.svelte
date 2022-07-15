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
		countSpec,
		histogramSpec,
		histogramSpecNotColored,
	} from "./vegaSpecs";
	import * as aq from "arquero";
	import * as d3c from "d3-scale-chromatic";

	export let col: ZenoColumn;
	$: hash = columnHash(col);

	enum ChartType {
		Count,
		Histogram,
		Binary,
		Other,
	}
	let chartType: ChartType;

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

	function countGivenBins({
		bins,
		table,
	}: {
		bins: IBin[];
		table: ColumnTable;
	}) {
		let newCounts = bins.map(() => 0);
		tableIter: for (const row of table) {
			const value = row[hash];
			for (let i = 0; i < bins.length; i++) {
				const bin = bins[i];
				if (value >= bin.binStart && value < bin.binEnd) {
					newCounts[i]++;
					continue tableIter;
				}
			}
		}
		return newCounts;
	}
	function binGroups(columnNames: string[], t = $table, precomputed = "") {
		const counts = [];
		const binName = (col) => `bin_${col}`;
		const countCol = "count";
		for (const name of columnNames) {
			const binColName = binName(name);
			const grouped = t.groupby({ [binColName]: aq.bin(name) });

			const binnedData = grouped
				.count({ as: countCol })
				.impute(
					{ count: () => 0 },
					{
						expand: {
							[binColName]: `(d) => op.sequence(...op.bins(d.${binColName}))`,
						},
					}
				)
				.orderby(binColName);
			counts.push({
				[name]: {
					bins: binnedData.columnArray(binColName),
					counts: binnedData.columnArray(countCol),
				},
			});
		}
		return counts;
	}

	function updateData(table: ColumnTable) {
		if (
			(chartType === ChartType.Count || chartType === ChartType.Histogram) &&
			table.column(hash)
		) {
			let arr = table.array(hash);
			data = { table: arr };
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
					colorAssignments = colorLabelCategorical(hash);
					chartType = ChartType.Binary;
					$availableColors.set(hash, colorAssignments);
				}
			} else if (isOrdinal) {
				if (unique <= 20) {
					chartType = ChartType.Count;
					colorAssignments = colorLabelCategorical(hash);
					$availableColors.set(hash, colorAssignments);
				} else {
					chartType = ChartType.Other;
				}
			} else {
				if (unique < 20) {
					chartType = ChartType.Count;
				} else {
					colorAssignments = colorLabelContin(hash);
					chartType = ChartType.Histogram;
					bins = bin(hash, $table);
					$availableColors.set(hash, colorAssignments);
					histoData.table = bins.map((d) => ({
						...d,
						filteredCount: d.count,
					}));
				}
			}
		}
	}

	function colorLabelContinuous(columnName: string, t = $table) {
		let niceBins = bin(columnName, t);
		let labels = [];
		for (const row of t) {
			let i = 0;
			for (const bin of niceBins) {
				if (row[columnName] >= bin.binStart && row[columnName] < bin.binEnd) {
					labels.push(i);
					continue;
				}
				i++;
			}
		}
		return labels;
	}

	function colorLabelContin(columnName: string, t = $table) {
		let colorArray = ["#1f77b4"];
		let colorLabels = [];
		for (const row of t) {
			colorLabels.push({
				id: row[columnHash($settings.idColumn)],
				colorIndex: 0,
			});
		}
		return {
			colors: colorArray,
			labels: colorLabels,
			hash,
		} as IColorAssignments;
	}

	function colorLabelCategorical(columnName: string, t = $table) {
		const colorArray = d3c.schemeCategory10;
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
			colors: colorArray,
			labels: colorLabels,
			hash,
		} as IColorAssignments;
	}

	function bin(hash: string, t = $table) {
		const groups = binGroups([hash], t)[0][hash];
		const inc = groups.bins[1];
		let formatted = [];
		let i = 0,
			k = 1;
		while (k < groups.bins.length) {
			const binStart = groups.bins[i];
			const binEnd = groups.bins[k];
			const count = groups.counts[i];
			formatted.push({ binStart, binEnd, count });
			i++;
			k++;
		}
		const binStart = groups.bins[i];
		const binEnd = binStart + inc;
		const count = groups.counts[i];
		formatted.push({ binStart, binEnd, count });
		return formatted;
	}

	table.subscribe((t) => drawChart(t));
	filteredTable.subscribe((t) => {
		const filteredCounts = countGivenBins({
			bins: bins,
			table: t,
		});
		histoData.table = bins.map((d, i) => ({
			...d,
			filteredCount: filteredCounts[i],
		}));
		histoData = { ...histoData };
	});
	onMount(() => {
		drawChart($table);
		updateData($table);
	});

	$: {
		col;
		drawChart($table);
		updateData($table);
	}

	metadataSelections.subscribe((m) => {
		if (!m.has(hash) && view) {
			if (view.getState().signals["brush_data"]) {
				view.signal("brush", {});
				view.signal("brush_data", {});
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
				(...s) => (selection = s[1].data ? ["points", ...s[1].data] : undefined)
			);
		}
	}

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
			style:color={$colorByHash === hash ? "#9B52DF" : ""}
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
						<Label>Is</Label>
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
						<Label>Is Not</Label>
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
	{#if data.table.length > 0 && (chartType === ChartType.Histogram || chartType === ChartType.Count)}
		<div
			id="histogram"
			on:mouseup={setSelection}
			on:mouseout={setSelection}
			on:click={setSelection}
			on:blur={setSelection}>
			<VegaLite
				spec={chartType === ChartType.Histogram
					? $colorByHash === hash
						? histogramSpec
						: histogramSpecNotColored
					: countSpec}
				data={chartType === ChartType.Histogram ? histoData : data}
				bind:view
				options={{ tooltip: true, actions: false, theme: "vox" }} />
		</div>
	{/if}
</div>

<style>
	.cell {
		border: 1px solid #e0e0e0;
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
