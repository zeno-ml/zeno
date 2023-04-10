<script lang="ts">
	import {
		mdiFolderPlusOutline,
		mdiInformationOutline,
		mdiPlus,
		mdiPlusCircle,
	} from "@mdi/js";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { InternMap } from "internmap";
	import {
		getHistogramCounts,
		getHistogramMetrics,
		getHistograms,
		type HistogramEntry,
	} from "../api/metadata";
	import { getMetricsForSlices } from "../api/slice";
	import {
		folders,
		metric,
		metricRange,
		metrics,
		model,
		models,
		requestingHistogramCounts,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
		showNewFolder,
		showNewSlice,
		slices,
		sliceToEdit,
		status,
	} from "../stores";
	import { columnHash } from "../util/util";
	import {
		ZenoColumnType,
		type MetricKey,
		type Slice,
		type ZenoColumn,
	} from "../zenoservice";
	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./cells/MetadataCell.svelte";
	import SliceCell from "./cells/SliceCell.svelte";
	import MetricRange from "./MetricRange.svelte";

	let metadataHistograms: InternMap<ZenoColumn, HistogramEntry[]> =
		new InternMap([], columnHash);

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
		selections.set({ metadata: {}, slices: [] });
		getHistograms($status.completeColumns, model).then((res) => {
			getHistogramCounts(res, null, null).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
				getHistogramMetrics(res, null, model, $metric, null).then((res) => {
					if (res === undefined) {
						return;
					}
					metadataHistograms = res;
				});
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
				predicates: [$selectionPredicates],
				join: "",
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
					predicates: [$selectionPredicates],
					join: "",
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
				predicates: [sels],
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
					predicates: [sels],
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

	<div id="slice-header" class="inline">
		<div class="inline">
			<h4>Slices</h4>
			<div
				class="information-tooltip"
				use:tooltip={{
					content: "Slices are named combinations of filters.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
					<path d={mdiInformationOutline} />
				</Icon>
			</div>
		</div>
		<div class="inline">
			<div
				use:tooltip={{
					content: "Create a new folder.",
					position: "left",
					theme: "zeno-tooltip",
				}}>
				<IconButton
					on:click={() => {
						showNewSlice.set(false);
						showNewFolder.update((b) => !b);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiFolderPlusOutline} />
					</Icon>
				</IconButton>
			</div>
			<div
				use:tooltip={{
					content: "Create a new slice.",
					position: "left",
					theme: "zeno-tooltip",
				}}>
				<IconButton
					on:click={() => {
						sliceToEdit.set(undefined);
						showNewSlice.update((d) => !d);
						showNewFolder.set(false);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						{#if $selectionPredicates.predicates.length > 0}
							<path fill="#6a1a9a" d={mdiPlusCircle} />
						{:else}
							<path fill="black" d={mdiPlus} />
						{/if}
					</Icon>
				</IconButton>
			</div>
		</div>
	</div>
	<div
		class={"overview " +
			($selectionPredicates.predicates.length === 0 ? "selected" : "")}
		on:keydown={() => ({})}
		on:click={() => {
			selections.update((m) => {
				Object.keys(m.metadata).forEach((key) => {
					m.metadata[key] = { predicates: [], join: "" };
				});
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
			<span class="size">({$settings.totalSize.toLocaleString()})</span>
			<div style:width="36px" />
		</div>
	</div>

	{#each $folders as folder}
		<FolderCell {folder} />
	{/each}

	{#each [...$slices.values()].filter((s) => s.folder === "") as s (s.sliceName)}
		<SliceCell slice={s} />
	{/each}

	<div id="metric-header" class="inline" style:margin-top="10px">
		<div class="inline">
			<h4>Metadata</h4>
			<div
				class="information-tooltip"
				use:tooltip={{
					content:
						"Interactive distributions for metadata columns. Click or drag on the histograms to filter the data. Add new metadata with @distill functions.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<Icon style="outline:none" component={Svg} viewBox="-6 -6 36 36">
					<path d={mdiInformationOutline} />
				</Icon>
			</div>
			{#if $requestingHistogramCounts}
				<CircularProgress
					style="height: 15px; width: 15px; margin-left: 10px;"
					indeterminate />
			{/if}
		</div>
		<MetricRange />
	</div>
	{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col (columnHash(col))}
		<MetadataCell {col} histogram={metadataHistograms.get(col)} />
	{/each}

	{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col (columnHash(col))}
		<MetadataCell {col} histogram={metadataHistograms.get(col)} />
	{/each}

	{#if $model}
		{#each $status.completeColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model) as col (columnHash(col))}
			<MetadataCell {col} histogram={metadataHistograms.get(col)} />
		{/each}

		{@const outputCol = $status.completeColumns.filter(
			(m) => m.columnType === ZenoColumnType.OUTPUT && m.name === $model
		)}
		{#if outputCol.length > 0}
			<MetadataCell
				col={outputCol[0]}
				histogram={metadataHistograms.get(outputCol[0])} />
		{/if}
	{/if}
</div>

<style>
	#slice-header {
		position: sticky;
		top: -10px;
		z-index: 3;
		background-color: var(--Y2);
	}
	#metric-header {
		position: sticky;
		top: 40px;
		z-index: 2;
		border-bottom: 0.5px solid var(--G5);
		background-color: var(--Y2);
	}
	.side-container {
		height: calc(100vh - 15px);
		width: 360px;
		min-width: 360px;
		max-width: 360px;
		padding-top: 10px;
		padding-bottom: 0px;
		padding-left: 15px;
		padding-right: 10px;
		overflow-y: scroll;
		background-color: var(--Y2);
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
	/* I don't see where this is used, maybe delete? */
	.cell {
		border: 0.5px solid var(--G5);
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
		border: 1px solid var(--G5);
		border-radius: 4px;
		padding-left: 10px;
		justify-content: space-between;
		padding-right: 10px;
		min-height: 36px;
		cursor: pointer;
		color: var(--G1);
	}
	.selected {
		background: var(--P3);
	}
	.size {
		font-style: italic;
		color: var(--G3);
		margin-right: 10px;
		margin-left: 10px;
	}
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
