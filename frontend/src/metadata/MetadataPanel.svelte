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
		metricRange,
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
	model.subscribe(() => {
		// When model changes, update slice items (may change with postdistill values).
		updateSliceIdxs();
		// Also clear the metadata selection, can't dynamicallly update currently.
		metadataSelections.set(new Map());
	});

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

	$: completedColumnHashes = $status.completeColumns.map((c) => columnHash(c));
</script>

<div class="side-container">
	<div class="inline">
		<h4>Slices</h4>
		<div class="inline">
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

		<div class="inline">
			<span>
				{#await res then r}
					{r && r[0] !== null && r[0] !== undefined ? r[0].toFixed(2) : ""}
				{/await}
			</span>
			<span class="size">({$table.size})</span>
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
		<div id="legend-container">
			<span style:margin-right="20px" style:font-style="italic">
				{$metric}:
			</span>
			<span contenteditable="true">{$metricRange[0].toFixed(2)}</span>
			<div id="legend" />
			<span contenteditable="true"> {$metricRange[1].toFixed(2)}</span>
		</div>
	</div>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataCell {col} {shouldColor} />
	{/each}

	{#if $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL).length > 0}
		<h4 style:margin-top="30px">Distilled Metadata</h4>
	{/if}
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		{@const idx = completedColumnHashes.indexOf(columnHash(col))}
		{#if idx > -1}
			<MetadataCell col={$status.completeColumns[idx]} {shouldColor} />
		{:else}
			<MetadataCell {col} {shouldColor} />
		{/if}
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
