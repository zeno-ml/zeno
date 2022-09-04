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

	export let col: ZenoColumn;
	export let shouldColor = false;
	export let assignColors: boolean = shouldColor;

	interface IColorAssignments {
		colors: string[];
		labels: { id: string; colorIndex: number }[];
		hash: string;
	}

	let selection: MetadataSelection = {
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
		col.metadataType === MetadataType.CONTINUOUS
			? generateHistogramSpec
			: generateCountSpec;

	table.subscribe((t) => drawChart(t));

	onMount(() => {
		selection.column = col;
		drawChart($table);
		updateData($table, $table);
	});

	function updateData(table: ColumnTable, filteredTable: ColumnTable) {
		if (
			(col.metadataType === MetadataType.NOMINAL ||
				col.metadataType === MetadataType.CONTINUOUS) &&
			table.column(hash) &&
			domain
		) {
			const counts = computeCountsFromDomain({
				table: filteredTable,
				domain,
				column: hash,
				type: col.metadataType,
			});
			if (col.metadataType === MetadataType.NOMINAL) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i].count,
					count: d["count"],
					category: d["category"],
					color: d["color"],
				}));
			} else if (col.metadataType === MetadataType.CONTINUOUS) {
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
		if (!t.column(hash)) {
			return;
		}

		const { assignments, domain: localDomain } = computeDomain({
			type: col.metadataType,
			table: $table,
			column: hash,
		});
		domain = localDomain;
		domain.forEach((d) => (d["filteredCount"] = d["count"]));

		colorDomain({ domain, type: col.metadataType });

		if (assignColors) {
			const colors = assignColorsFromDomain({
				assignments,
				domain,
				column: hash,
				idColumn: $settings.idColumn,
				table: $table,
				type: col.metadataType,
			});
			if (colors) {
				availableColors.set({ ...$availableColors, [hash]: colors });
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
			{#if col.metadataType === MetadataType.BOOLEAN}
				<BinaryMetadataCell
					bind:selection
					{setSelection}
					{hash}
					{selectedHash}
					{colorAssignments} />
			{/if}

			{#if col.metadataType === MetadataType.OTHER}
				<TextMetadataCell bind:selection {setSelection} {hash} />
			{/if}

			{#if selection.values && col.metadataType === MetadataType.CONTINUOUS}
				<div>
					<span>
						{selection.values[0] ? selection.values[0].toFixed(2) + " - " : ""}
						{selection.values[1] ? selection.values[1].toFixed(2) : ""}
					</span>
				</div>
			{/if}

			{#if col.metadataType !== MetadataType.OTHER && shouldColor && (hoveringCell || selectedHash)}
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

	{#if col.metadataType === MetadataType.DATETIME && domain}
		<DateMetadataCell bind:selection bind:domain {hash} {setSelection} />
	{/if}

	{#if histogramData.table.length > 0 && (col.metadataType === MetadataType.CONTINUOUS || col.metadataType === MetadataType.NOMINAL)}
		<ChartMetadataCell
			bind:selection
			{setSelection}
			{dynamicSpec}
			{shouldColor}
			{selectedHash}
			{domain}
			{histogramData}
			{hash}
			metadataType={col.metadataType} />
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
		z-index: 2;
	}
</style>
