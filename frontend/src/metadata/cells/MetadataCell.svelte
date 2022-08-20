<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";

	import { onMount } from "svelte";

	import IconButton from "@smui/icon-button";

	import { columnHash } from "../../util/util";
	import { MetadataType } from "../../globals";
	import { generateCountSpec, generateHistogramSpec } from "./vegaSpecs";
	import {
		metadataSelections,
		table,
		settings,
		availableColors,
		colorByHash,
		filteredTable,
		model,
	} from "../../stores";
	import {
		computeCountsFromDomain,
		computeDomain,
		assignColorsFromDomain,
		colorDomain,
	} from "../metadata";

	import DateMetadataCell from "./DateMetadataCell.svelte";
	import BinaryMetadataCell from "./BinaryMetadataCell.svelte";
	import ChartMetadataCell from "./ChartMetadataCell.svelte";
	import TextMetadataCell from "./TextMetadataCell.svelte";

	interface IColorAssignments {
		colors: string[];
		labels: { id: string; colorIndex: number }[];
		hash: string;
	}

	export let col: ZenoColumn;
	export let shouldColor = false;
	export let assignColors: boolean = shouldColor;

	let chartType: MetadataType;
	let selection: MetadataSelection = {
		type: MetadataType.OTHER,
		column: col,
		values: [],
	};
	// TODO: make interface.
	let domain: object[];
	let histogramData = { table: [] };
	let colorAssignments: IColorAssignments = {
		colors: [],
		labels: [],
		hash: "",
	};
	let hoveringCell = false;

	$: hash = columnHash(col);
	$: {
		if (assignColors === true && $model) {
			drawChart($table);
		}
	}
	$: selectedHash = $colorByHash === hash;
	$: selectedHashColor = shouldColor ? (selectedHash ? "#9B52DF" : "") : "";
	$: {
		col;
		updateData($table, $filteredTable);
	}
	$: dynamicSpec =
		chartType === MetadataType.HISTOGRAM
			? generateHistogramSpec
			: generateCountSpec;

	table.subscribe((t) => drawChart(t));

	onMount(() => {
		selection.column = col;
		drawChart($table);
		updateData($table, $filteredTable);
	});

	function updateData(table: ColumnTable, filteredTable: ColumnTable) {
		if (
			(chartType === MetadataType.COUNT ||
				chartType === MetadataType.HISTOGRAM) &&
			table.column(hash)
		) {
			const counts = computeCountsFromDomain({
				table: filteredTable,
				domain,
				column: hash,
				type: chartType,
			});
			if (chartType === MetadataType.COUNT) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i].count,
					count: d["count"],
					category: d["category"],
					color: d["color"],
				}));
			} else if (chartType === MetadataType.HISTOGRAM) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i].count,
					count: d["count"],
					binStart: d["binStart"],
					binEnd: d["binEnd"],
					color: d["color"],
				}));
			}
			histogramData = { table: domain };
		}
	}

	function drawChart(t: ColumnTable) {
		if (t.column(hash)) {
			let isOrdinal = isNaN(Number(t.column(hash).get(0)));
			let unique = t
				.rollup({ unique: `d => op.distinct(d["${hash}"])` })
				.object()["unique"];

			if (isOrdinal) {
				if (unique <= 20) {
					chartType = MetadataType.COUNT;
				} else if (!isNaN(Date.parse(t.column(hash).get(0)))) {
					chartType = MetadataType.DATE;
				} else {
					chartType = MetadataType.OTHER;
				}
			} else {
				if (unique === 2) {
					let vals = t
						.orderby(hash)
						.rollup({ a: `d => op.array_agg_distinct(d["${hash}"])` })
						.object()["a"];
					if (Number(vals[0]) === 0 && Number(vals[1]) === 1) {
						chartType = MetadataType.BINARY;
					}
				} else if (unique < 20) {
					chartType = MetadataType.COUNT;
				} else {
					chartType = MetadataType.HISTOGRAM;
				}
			}

			const { assignments, domain: localDomain } = computeDomain({
				type: chartType,
				table: $table,
				column: hash,
			});
			domain = localDomain;
			domain.forEach((d) => (d["filteredCount"] = d["count"]));

			selection.type = chartType;

			colorDomain({ domain, type: chartType });

			if (assignColors) {
				const colors = assignColorsFromDomain({
					assignments,
					domain,
					column: hash,
					idColumn: $settings.idColumn,
					table: $table,
					type: chartType,
				});
				if (colors) {
					availableColors.set({ ...$availableColors, [hash]: colors });
				}
			}
		}
	}

	function setSelection() {
		metadataSelections.update((m) => {
			if (selection.values.length === 0) {
				m.delete(hash);
				return m;
			}
			m.set(hash, selection);
			return m;
		});
	}
</script>

<div
	class="cell"
	on:mouseenter={() => (hoveringCell = true)}
	on:mouseleave={() => (hoveringCell = false)}>
	<div id="info">
		<div id="label" class="top-text">
			<span style:color={selectedHashColor}>{col.name}</span>
		</div>

		<div class="top-right-cell">
			{#if chartType === MetadataType.BINARY}
				<BinaryMetadataCell
					bind:selection
					{setSelection}
					{hash}
					{selectedHash}
					{colorAssignments} />
			{/if}

			{#if chartType === MetadataType.OTHER}
				<TextMetadataCell bind:selection {setSelection} {hash} />
			{/if}

			{#if selection.values && selection.type === MetadataType.HISTOGRAM}
				<div>
					<span>
						{selection.values[0] ? selection.values[0].toFixed(2) + " - " : ""}
						{selection.values[1] ? selection.values[1].toFixed(2) : ""}
					</span>
				</div>
			{/if}

			{#if chartType !== MetadataType.OTHER && shouldColor && (hoveringCell || selectedHash)}
				<div class="top-text">
					<IconButton
						size="mini"
						class="material-icons"
						style="color: {selectedHashColor}; margin-top: -10px;"
						on:click={() => {
							colorByHash.set(hash);
						}}>brush</IconButton>
				</div>
			{/if}
		</div>
	</div>

	{#if chartType === MetadataType.DATE && domain}
		<DateMetadataCell bind:selection bind:domain {hash} {setSelection} />
	{/if}

	{#if histogramData.table.length > 0 && (chartType === MetadataType.HISTOGRAM || chartType === MetadataType.COUNT)}
		<ChartMetadataCell
			bind:selection
			{setSelection}
			{dynamicSpec}
			{shouldColor}
			{selectedHash}
			{domain}
			{histogramData}
			{hash}
			{chartType} />
	{/if}
</div>

<style>
	.cell {
		border-top: 1px solid #e0e0e0;
		border-bottom: 1px solid #e0e0e0;
		padding: 10px;
		min-width: calc(100% - 30px);
		width: fit-content;
		display: flex;
		flex-direction: column;
	}
	#info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		margin-left: 5px;
		margin-bottom: 5px;
		color: #666;
	}
	.top-right-cell {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.top-text {
		height: 18px;
	}
	.top-right-cell {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.top-text {
		height: 18px;
		z-index: 998;
	}
</style>
