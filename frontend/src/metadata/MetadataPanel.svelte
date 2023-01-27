<script lang="ts">
	import { mdiFolderPlusOutline, mdiPlus, mdiPlusCircle } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";

	import MetricRange from "./MetricRange.svelte";
	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./cells/MetadataCell.svelte";
	import SliceCell from "./cells/SliceCell.svelte";
	import NewFolderPopup from "./popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./popups/NewSlicePopup.svelte";

	import Select, { Option } from "@smui/select";
	import Tooltip, { Wrapper } from "@smui/tooltip";
	import { InternMap } from "internmap";
	import {
		getHistogramCounts,
		getHistogramMetrics,
		getHistograms,
	} from "../api/metadata";
	import { getMetricsForSlices } from "../api/slice";
	import { ZenoColumnType } from "../globals";
	import {
		folders,
		metric,
		metricRange,
		metrics,
		model,
		models,
		selectionPredicates,
		selections,
		settings,
		showNewSlice,
		slices,
		sliceToEdit,
		status,
		selectionIds,
	} from "../stores";
	import { columnHash } from "../util/util";

	let metadataHistograms: InternMap<ZenoColumn, HistogramEntry[]> =
		new InternMap([], columnHash);
	let showNewFolder = false;

	$: res = getMetricsForSlices([
		<MetricKey>{
			sli: <Slice>{
				sliceName: "",
				folder: "",
				filterPredicates: { predicates: [], join: "" },
			},
			model: $model,
			metric: $metric,
		},
	]);

	// Get histogram buckets, counts, and metrics when columns update.
	status.subscribe((s) => {
		getHistograms(s.completeColumns, $model).then((res) => {
			getHistogramCounts(res, null, $selectionIds).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
				getHistogramMetrics(res, null, $model, $metric, $selectionIds).then(
					(res) => {
						if (res !== undefined) {
							metadataHistograms = res;
						}
					}
				);
			});
		});
	});

	// Calculate histogram metrics when metric changes
	metric.subscribe((metric) => {
		if (metadataHistograms.size === 0) {
			return;
		}
		metricRange.set([Infinity, -Infinity]);
		getHistogramMetrics(
			metadataHistograms,
			null,
			$model,
			metric,
			$selectionIds
		).then((res) => {
			if (res === undefined) {
				return;
			}
			metadataHistograms = res;
		});
	});

	// Calculate histogram counts when model changes for postdistill columns
	model.subscribe((model) => {
		if (metadataHistograms.size === 0) {
			return;
		}
		getHistograms($status.completeColumns, model).then((res) => {
			getHistogramCounts(res, null, $selectionIds).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
				getHistogramMetrics(res, null, model, $metric, $selectionIds).then(
					(res) => {
						if (res === undefined) {
							return;
						}
						metadataHistograms = res;
					}
				);
			});
		});
	});

	// when the selection Ids change, update the histograms
	selectionIds.subscribe((selectionIds) => {
		if (metadataHistograms.size === 0) {
			return;
		}
		getHistogramCounts(
			metadataHistograms,
			{
				predicates: $selectionPredicates,
				join: "&",
			},
			selectionIds
		).then((res) => {
			if (res === undefined) {
				return;
			}

			metadataHistograms = res;
			getHistogramMetrics(
				res,
				{
					predicates: $selectionPredicates,
					join: "&",
				},
				$model,
				$metric,
				selectionIds
			).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
			});
		});
	});

	// Update counts and metrics when selection changes.
	selectionPredicates.subscribe((sels) => {
		if (metadataHistograms.size === 0) {
			return;
		}
		getHistogramCounts(
			metadataHistograms,
			{
				predicates: sels,
				join: "&",
			},
			$selectionIds
		).then((res) => {
			if (res === undefined) {
				return;
			}

			metadataHistograms = res;
			getHistogramMetrics(
				res,
				{
					predicates: sels,
					join: "&",
				},
				$model,
				$metric,
				$selectionIds
			).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
			});
		});
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
		<MetricRange />
	</div>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataCell {col} histogram={metadataHistograms.get(col)} />
	{/each}

	{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		<MetadataCell {col} histogram={metadataHistograms.get(col)} />
	{/each}

	{#if $model}
		{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model) as col}
			<MetadataCell {col} histogram={metadataHistograms.get(col)} />
		{/each}
	{/if}
</div>

<style>
	.side-container {
		height: calc(100vh - 15px);
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
		border: 0.5px solid #d1d1d1;
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
</style>
