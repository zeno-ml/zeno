<script lang="ts">
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiFolderPlusOutline, mdiPlus, mdiPlusCircle } from "@mdi/js";

	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./cells/MetadataCell.svelte";
	import NewFolderPopup from "./popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./popups/NewSlicePopup.svelte";
	import SliceCell from "./cells/SliceCell.svelte";

	import {
		folders,
		selections,
		metric,
		model,
		settings,
		showNewSlice,
		slices,
		sliceToEdit,
		status,
		metricRange,
		zenoState,
		selectionPredicates,
		metrics,
		models,
	} from "../stores";
	import Select, { Option } from "@smui/select";
	import { columnHash } from "../util/util";
	import { getHistograms, getMetricsForSlices } from "../api";
	import { ZenoColumnType } from "../globals";
	import Button from "@smui/button/src/Button.svelte";
	import Tooltip, { Wrapper } from "@smui/tooltip";

	let metadataHistograms = {};
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

	zenoState.subscribe((state) => {
		getHistograms(
			$status.completeColumns,
			$selectionPredicates,
			state,
			Boolean($model && $metric)
		).then((res) => (metadataHistograms = res));
	});

	selectionPredicates.subscribe((sels) => {
		getHistograms($status.completeColumns, sels, $zenoState, false).then(
			(res) => (metadataHistograms = res)
		);
	});
</script>

<div class="side-container">
	<div id="selections">
		{#if $model !== undefined}
			<Select
				bind:value={$model}
				label="Model"
				style="margin-right: 10px; width: 170px">
				{#each $models as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
		{#if $metric !== undefined}
			<Select bind:value={$metric} label="Metric" style="width: 170px">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
		{/if}
	</div>

	<div class="inline">
		<h4>Slices</h4>
		<div class="inline">
			<div>
				<Wrapper>
					<IconButton on:click={() => (showNewFolder = !showNewFolder)}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiFolderPlusOutline} />
						</Icon>
					</IconButton>
					<Tooltip xPos="start">Create a new folder</Tooltip>
				</Wrapper>
				{#if showNewFolder}
					<NewFolderPopup bind:showNewFolder />
				{/if}
			</div>
			<div>
				<Wrapper>
					<IconButton
						on:click={() => {
							sliceToEdit.set(undefined);
							showNewSlice.set(true);
						}}>
						<Icon component={Svg} viewBox="0 0 24 24">
							{#if $selectionPredicates.length > 0}
								<path fill="#6a1a9a" d={mdiPlusCircle} />
							{:else}
								<path fill="black" d={mdiPlus} />
							{/if}
						</Icon>
					</IconButton>
					<Tooltip xPos="start">Create a new slice</Tooltip>
				</Wrapper>
				{#if $showNewSlice}
					<NewSlicePopup />
				{/if}
			</div>
		</div>
	</div>
	<div
		class={"overview " + ($selectionPredicates.length === 0 ? "selected" : "")}
		on:keydown={() => ({})}
		on:click={() => {
			selections.update((m) => {
				for (let key in m.metadata) {
					m.metadata[key] = { predicates: [], join: "&" };
				}
				return { slices: [], metadata: { ...m.metadata } };
			});
		}}>
		<div class="inline">All instances</div>

		<div class="inline">
			<span>
				{#await res then r}
					{r && r[0].metric ? r[0].metric.toFixed(2) : ""}
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

	<div class="inline" style:margin-top="10px">
		<h4>Metadata</h4>
		{#if $metrics.length !== 0}
			<div id="legend-container">
				{#if $metricRange[2] && $metricRange[0] !== Infinity}
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
				{:else}
					<Button
						on:click={() => {
							getHistograms(
								$status.completeColumns,
								$selectionPredicates,
								$zenoState,
								true
							).then((res) => (metadataHistograms = res));
						}}>get metrics</Button>
				{/if}
			</div>
		{/if}
	</div>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataCell {col} histogram={metadataHistograms[columnHash(col)]} />
	{/each}

	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		{@const idx = completedColumnHashes.indexOf(columnHash(col))}
		<MetadataCell
			col={idx > -1 ? $status.completeColumns[idx] : col}
			histogram={metadataHistograms[columnHash(col)]} />
	{/each}

	{#if $model}
		{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model) as col}
			<MetadataCell {col} histogram={metadataHistograms[columnHash(col)]} />
		{/each}
	{/if}
</div>

<style>
	.side-container {
		height: 100vh;
		width: 350px;
		min-width: 350px;
		max-width: 350px;
		padding-top: 10px;
		padding-bottom: 0px;
		padding-left: 15px;
		padding-right: 10px;
		overflow-y: scroll;
		background-color: #fbfbfa;
	}
	.ghost-container {
		width: 100%;
		position: absolute;
	}
	#selections {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 10px;
		padding-top: 5px;
	}
	.cell {
		border: 0.5px solid #ebebea;
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
	}
	.overview {
		display: flex;
		align-items: center;
		border: 0.5px solid #e0e0e0;
		border-radius: 5px;
		padding-left: 10px;
		justify-content: space-between;
		padding-right: 10px;
		height: 36px;
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
