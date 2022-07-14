<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { View } from "svelte-vega";

	import Button from "@smui/button";
	import { Label } from "@smui/common";

	import { VegaLite } from "svelte-vega";
	import { onMount } from "svelte";

	import { metadataSelections, table } from "../stores";
	import { columnHash } from "../util";
	import { countSpec, histogramSpec } from "./vegaSpecs";

	export let col: ZenoColumn;
	$: hash = columnHash(col);

	enum ChartType {
		Count,
		Histogram,
		Binary,
		Other,
	}
	let chartType: ChartType;

	let selection = undefined;
	let finalSelection = undefined;
	let view: View;
	let data = { table: [] };

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
					chartType = ChartType.Binary;
				}
			} else if (isOrdinal) {
				chartType = unique > 20 ? ChartType.Other : ChartType.Count;
			} else {
				chartType = unique < 20 ? ChartType.Count : ChartType.Histogram;
			}
		}
	}

	table.subscribe((t) => drawChart(t));
	onMount(() => {
		drawChart($table);
		updateData($table);
	});

	$: {
		col;
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
			view.addSignalListener(
				"brush",
				(...s) => (selection = s[1].data ? ["range", ...s[1].data] : undefined)
			);
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
		<span>{col.name}</span>
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
				spec={chartType === ChartType.Histogram ? histogramSpec : countSpec}
				{data}
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
