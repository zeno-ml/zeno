<script lang="ts">
	import { Svg } from "@smui/common/elements";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiFolderPlusOutline, mdiPlus } from "@mdi/js";

	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./cells/MetadataCell.svelte";
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
		table,
		transform,
	} from "../stores";
	import {
		columnHash,
		getMetricsForSlices,
		updateFilteredTable,
		updateSliceIdxs,
	} from "../util/util";
	import { ZenoColumnType } from "../globals";

	export let shouldColor = false;

	let showNewFolder = false;

	table.subscribe((t) => updateFilteredTable(t));
	metadataSelections.subscribe(() => updateFilteredTable($table));
	sliceSelections.subscribe(() => updateFilteredTable($table));

	model.subscribe(() => updateSliceIdxs());

	$: res = getMetricsForSlices([
		<MetricKey>{
			sli: <Slice>{
				sliceName: "overall",
				folder: "",
				idxs: $table.array(columnHash($settings.idColumn)),
			},
			metric: $metric,
			model: $model,
			transform: $transform,
		},
	]);
</script>

<div class="side-container">
	<div
		class={"overview " +
			($sliceSelections.length + $metadataSelections.size === 0
				? "selected"
				: "")}
		on:click={() => {
			sliceSelections.set([]);
			metadataSelections.set(new Map());
		}}>
		<div class="inline" style:height="44px">All instances</div>
		<div>
			<span>{#await res then r}{r && r[0] ? r[0].toFixed(2) : ""}{/await}</span>
			<span class="size">({$table.size})</span>
		</div>
	</div>

	{#if $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.WEAK_LABEL).length > 0}
		<h4>Weak Labels</h4>
		{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.WEAK_LABEL) as col}
			<MetadataCell {col} {shouldColor} />
		{/each}
	{/if}

	<div class="inline">
		<h4>Slices</h4>
		<div style:margin-right="13px" class="inline">
			<div>
				<div on:click={() => (showNewFolder = true)}>
					<IconButton>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiFolderPlusOutline} />
						</Icon>
					</IconButton>
				</div>
				{#if showNewFolder}
					<NewFolderPopup bind:showNewFolder />
				{/if}
			</div>
			<div>
				<div
					on:click={() => {
						sliceToEdit.set(undefined);
						showNewSlice.set(true);
					}}>
					<IconButton>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiPlus} />
						</Icon>
					</IconButton>
				</div>
				{#if $showNewSlice}
					<NewSlicePopup />
				{/if}
			</div>
		</div>
	</div>

	{#each $folders as folder}
		<FolderCell {folder} />
	{/each}

	{#each [...$slices.values()].filter((s) => s.folder === "") as s}
		<SliceCell slice={s} />
	{/each}

	<h4 style:margin-top="40px">Metadata</h4>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataCell {col} {shouldColor} />
	{/each}

	{#if $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL).length > 0}
		<h4 style:margin-top="40px">Distilled Metadata</h4>
	{/if}

	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		<MetadataCell {col} {shouldColor} />
	{/each}

	{#if $model}
		{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model && m.transform === $transform) as col}
			<MetadataCell {col} {shouldColor} />
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
		overflow-y: auto;
		min-width: 450px;
		padding: 10px;
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
		padding-left: 10px;
		justify-content: space-between;
		padding-right: 10px;
		margin-right: 10px;
		margin-top: 10px;
	}
	.selected {
		background: #f9f5ff;
	}
	.size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
</style>
