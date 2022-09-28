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
	} from "../../stores";
	import {
		computeCountsFromDomain,
		computeDomain,
		assignColorsFromDomain,
		colorDomain,
		getColorsByMetric,
	} from "../metadata";

	import DateMetadataCell from "./DateMetadataCell.svelte";
	import BinaryMetadataCell from "./BinaryMetadataCell.svelte";
	import ChartMetadataCell from "./ChartMetadataCell.svelte";
	import TextMetadataCell from "./TextMetadataCell.svelte";

	export let col: ZenoColumn;
	export let shouldColor = false;

	let hoveringCell = false;
	let domain: MetadataCellDomain[];
	let histogramData = { table: [] };
	let selection: MetadataSelection = {
		column: col,
		values: [],
	};
	let colorAssignments: {
		colors: string[];
		labels: { id: string; colorIndex: number }[];
		hash: string;
	} = {
		colors: [],
		labels: [],
		hash: "",
	};

	$: hash = columnHash(col);
	$: selectedHash = $colorByHash === hash;
	$: {
		shouldColor;
		updateData($filteredTable);
	}
	$: {
		col;
		drawChart($table);
	}
	onMount(() => {
		selection.column = col;
		updateData($filteredTable);
	});

	async function drawChart(t: ColumnTable) {
		if (!t.column(hash)) {
			return;
		}

		const { domain: lDomain, assignments } = computeDomain(
			col.metadataType,
			$table,
			hash
		);
		lDomain.forEach((d) => (d["filteredCount"] = d["count"]));
		domain = lDomain;

		colorDomain(domain, col.metadataType);
		let metricColors = await getColorsByMetric(
			$filteredTable,
			hash,
			columnHash($settings.idColumn),
			domain,
			col.metadataType
		);
		domain.forEach((d, i) => (d.metricColor = metricColors[i]));

		if (shouldColor) {
			const colors = assignColorsFromDomain(
				$table,
				domain,
				assignments,
				columnHash($settings.idColumn),
				hash,
				col.metadataType
			);
			if (colors) {
				availableColors.set({ ...$availableColors, [hash]: colors });
			}
		}
	}

	async function updateData(filteredTable) {
		if ($table.column(hash) && domain) {
			const counts = computeCountsFromDomain(
				filteredTable,
				hash,
				domain,
				col.metadataType
			);
			if (col.metadataType === MetadataType.NOMINAL) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i],
					count: d["count"],
					binStart: d["binStart"],
					color: d["color"],
				}));
			} else if (col.metadataType === MetadataType.CONTINUOUS) {
				domain = domain.map((d, i) => ({
					filteredCount: counts[i],
					count: d["count"],
					binStart: d["binStart"],
					binEnd: d["binEnd"],
					color: d["color"],
				}));
			}
			let metricColors = await getColorsByMetric(
				filteredTable,
				hash,
				columnHash($settings.idColumn),
				domain,
				col.metadataType
			);
			domain.forEach((d, i) => (d.metricColor = metricColors[i]));
			histogramData = { table: domain };
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
			<span style:color={shouldColor && selectedHash ? "#9B52DF" : ""}>
				{col.name}
			</span>
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
						style="color: {shouldColor && selectedHash
							? '#9B52DF'
							: ''}; margin-top: -10px;"
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
			dynamicSpec={col.metadataType === MetadataType.CONTINUOUS
				? generateHistogramSpec
				: generateCountSpec}
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
	}
</style>
