<script lang="ts">
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiFolderPlusOutline, mdiPlus } from "@mdi/js";

	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./MetadataCell.svelte";
	import NewFolderPopup from "./popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./popups/NewSlicePopup.svelte";
	import SliceCell from "./cells/SliceCell.svelte";

	import {
		folders,
		metadataSelections,
		metric,
		model,
		settings,
		showNewSlice,
		slices,
		sliceSelections,
		sliceToEdit,
		status,
		transform,
		metricRange,
		zenoState,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { getMetricsForSlices } from "../api";
	import { ZenoColumnType } from "../globals";

	export let shouldColor = false;
	export let metadataHistograms = {};

	let showNewFolder = false;

	$: completedColumnHashes = $status.completeColumns.map((c) => columnHash(c));
	$: res = getMetricsForSlices([
		<MetricKey>{
			sli: <Slice>{
				sliceName: "",
				folder: "",
				filterPredicates: { predicates: [], join: "" },
			},
			state: $zenoState,
		},
	]);
</script>

<div class="side-container">
	<div class="inline">
		<h4>Slices</h4>
		<div class="inline">
			<div>
				<IconButton on:click={() => (showNewFolder = true)}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiFolderPlusOutline} />
					</Icon>
				</IconButton>
				{#if showNewFolder}
					<NewFolderPopup bind:showNewFolder />
				{/if}
			</div>
			<div>
				<IconButton
					on:click={() => {
						sliceToEdit.set(undefined);
						showNewSlice.set(true);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiPlus} />
					</Icon>
				</IconButton>
				{#if $showNewSlice}
					<NewSlicePopup />
				{/if}
			</div>
		</div>
	</div>
	<div
		class={"overview " +
			($sliceSelections.length + Object.keys($metadataSelections).length === 0
				? "selected"
				: "")}
		on:click={() => {
			sliceSelections.set([]);
		}}
		on:keydown={() => ({})}>
		<div class="inline" style:height="44px">All instances</div>

		<div class="inline">
			<span>
				{#await res then r}
					{r && r[0] !== null && r[0] !== undefined ? r[0].toFixed(2) : ""}
				{/await}
			</span>
			<span class="size">({$settings.totalSize})</span>
			<div style:width="36px" />
		</div>
	</div>

	{#each $folders as folder}
		<FolderCell {folder} />
	{/each}

	{#each [...$slices.values()].filter((s) => s.folder === "") as s}
		<SliceCell slice={s} />
	{/each}

	<div class="inline" style:margin-top="20px">
		<h4>Metadata</h4>
		{#if $metricRange[0] !== Number.MAX_VALUE}
			<div id="legend-container">
				<span style:margin-right="20px" style:font-style="italic">
					{$metric}:
				</span>
				<span
					contenteditable="true"
					on:blur={(e) =>
						metricRange.update((range) => {
							range[0] = parseFloat(e.currentTarget.innerText);
							range[2] = true;
							return [...range];
						})}>
					{$metricRange[0].toFixed(2)}
				</span>
				<div id="legend" />
				<span
					contenteditable="true"
					on:blur={(e) =>
						metricRange.update((range) => {
							range[1] = parseFloat(e.currentTarget.innerText);
							range[2] = true;
							return [...range];
						})}>
					{$metricRange[1].toFixed(2)}
				</span>
			</div>
		{/if}
	</div>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataCell
			{col}
			{shouldColor}
			histogram={metadataHistograms[columnHash(col)]} />
	{/each}

	{#if $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL).length > 0}
		<h4 style:margin-top="30px">Distilled Metadata</h4>
	{/if}
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		{@const idx = completedColumnHashes.indexOf(columnHash(col))}
		<MetadataCell
			col={idx > -1 ? $status.completeColumns[idx] : col}
			{shouldColor}
			histogram={metadataHistograms[columnHash(col)]} />
	{/each}

	{#if $model}
		{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model && m.transform === $transform) as col}
			<MetadataCell
				{col}
				{shouldColor}
				histogram={metadataHistograms[columnHash(col)]} />
		{/each}
	{/if}
</div>

<style>
	h4 {
		font-weight: 500;
		color: rgba(0, 0, 0, 0.7);
	}
	.side-container {
		margin-left: 10px;
		height: calc(100vh - 165px);
		min-width: 450px;
		padding: 10px;
		padding-top: 0px;
		overflow-y: scroll;
	}
	.cell {
		border: 1px solid #e0e0e0;
		padding: 10px;
		min-width: 400px;
		width: 400px;
	}
	.inline {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.icon {
		width: 24px;
		height: 24px;
		margin-right: 10px;
	}
	.overview {
		display: flex;
		align-items: center;
		border: 0.5px solid #e0e0e0;
		border-radius: 5px;
		padding-left: 10px;
		justify-content: space-between;
		padding-right: 10px;
		padding-top: 5px;
		padding-bottom: 5px;
		height: 36px;
		margin-right: 10px;
		cursor: pointer;
	}
	.selected {
		background: #f9f5ff;
	}
	.size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
		margin-left: 10px;
	}
	#legend-container {
		padding-right: 10px;
		display: flex;
		align-items: center;
	}
	#legend {
		width: 70px;
		height: 15px;
		margin-left: 10px;
		margin-right: 10px;
		background-image: linear-gradient(to right, #decbe9, #6a1b9a);
	}
</style>
