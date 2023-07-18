<script lang="ts">
	import {
		mdiCreation,
		mdiCreationOutline,
		mdiFolderPlusOutline,
		mdiInformationOutline,
		mdiPlus,
		mdiPlusCircle,
	} from "@mdi/js";
	import Button from "@smui/button";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { InternMap } from "internmap";
	import {
		getHistogramCounts,
		getHistogramMetrics,
		getHistograms,
		type HistogramEntry,
	} from "../api/metadata";
	import { createNewTag } from "../api/tag";
	import {
		editId,
		editedIds,
		folders,
		folderToEdit,
		metric,
		metricRange,
		model,
		comparisonModel,
		requestingHistogramCounts,
		selectionIds,
		selectionPredicates,
		selections,
		showNewFolder,
		showNewSlice,
		showNewTag,
		showSliceFinder,
		sliceToEdit,
		slices,
		status,
		tagIds,
		tags,
		tab,
	} from "../stores";
	import { columnHash, updateModelDependentSlices } from "../util/util";
	import { ZenoColumnType, type ZenoColumn } from "../zenoservice";
	import MetricRange from "./MetricRange.svelte";
	import FolderCell from "./cells/FolderCell.svelte";
	import MetadataCell from "./cells/MetadataCell.svelte";
	import SliceCell from "./cells/SliceCell.svelte";
	import TagCell from "./cells/TagCell.svelte";
	import MetadataHeader from "./MetadataHeader.svelte";
	import SliceCellResult from "./cells/SliceCellResult.svelte";

	let metadataHistograms: InternMap<ZenoColumn, HistogramEntry[]> =
		new InternMap([], columnHash);
	let body: HTMLElement;

	// Get histogram buckets, counts, and metrics when columns update.
	status.subscribe((s) => {
		getHistograms(s.completeColumns, $model).then((res) => {
			getHistogramCounts(
				res,
				null,
				$tagIds,
				$selectionIds,
				$selections.tags
			).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
				getHistogramMetrics(
					res,
					null,
					$model,
					$metric,
					$tagIds,
					$selectionIds,
					$selections.tags
				).then((res) => {
					if (res !== undefined) {
						metadataHistograms = res;
					}
				});
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
			$tagIds,
			$selectionIds,
			$selections.tags
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
			getHistogramCounts(res, null, null, null, null).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
				getHistogramMetrics(res, null, model, $metric, null, null, null).then(
					(res) => {
						if (res === undefined) {
							return;
						}
						metadataHistograms = res;
					}
				);
			});
		});
		updateModelDependentSlices("model A", model, $slices);
	});

	comparisonModel.subscribe((mod) => {
		updateModelDependentSlices("model B", mod, $slices);
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
			$tagIds,
			selectionIds,
			$selections.tags
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
				$tagIds,
				selectionIds,
				$selections.tags
			).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
			});
		});
	});

	// when the tag Ids change, update the histograms
	tagIds.subscribe((tIds) => {
		if (metadataHistograms.size === 0) {
			return;
		}
		getHistogramCounts(
			metadataHistograms,
			{
				predicates: [$selectionPredicates],
				join: "",
			},
			tIds,
			$selectionIds,
			$selections.tags
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
				tIds,
				$selectionIds,
				$selections.tags
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
			$tagIds,
			$selectionIds,
			$selections.tags
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
				$tagIds,
				$selectionIds,
				$selections.tags
			).then((res) => {
				if (res === undefined) {
					return;
				}
				metadataHistograms = res;
			});
		});
	});
</script>

<div id="side-container" bind:this={body}>
	<MetadataHeader />
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
					content:
						$tab !== "comparison"
							? "Find underperforming slices."
							: "Find slices with the largest output differences between models",
					position: "left",
					theme: "zeno-tooltip",
					maxWidth: $tab !== "comparison" ? "150" : "200",
				}}>
				<IconButton
					on:click={() => {
						showNewFolder.set(false);
						showSliceFinder.update((c) => !c);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						{#if $selectionPredicates.predicates.length + $selections.tags.length > 0 || $selectionIds.ids.length > 0}
							<path fill="#6a1a9a" d={mdiCreation} />
						{:else}
							<path fill="var(--G1)" d={mdiCreationOutline} />
						{/if}
					</Icon>
				</IconButton>
			</div>
			<div
				use:tooltip={{
					content: "Create a new folder.",
					position: "left",
					theme: "zeno-tooltip",
				}}>
				<IconButton
					on:click={() => {
						folderToEdit.set(undefined);
						showNewSlice.set(false);
						showNewFolder.update((b) => !b);
						showSliceFinder.set(false);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="var(--G1)" d={mdiFolderPlusOutline} />
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
						showSliceFinder.set(false);
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						{#if $selectionPredicates.predicates.length > 0}
							<path fill="#6a1a9a" d={mdiPlusCircle} />
						{:else}
							<path fill="var(--G1)" d={mdiPlus} />
						{/if}
					</Icon>
				</IconButton>
			</div>
		</div>
	</div>
	<div
		class="overview
			{$selectionPredicates.predicates.length === 0 ? 'selected' : ''}
			{$tab === 'comparison' ? 'compare-slice-cell' : ''}"
		on:keydown={() => ({})}
		on:click={() => {
			selections.update((m) => {
				Object.keys(m.metadata).forEach((key) => {
					m.metadata[key] = { predicates: [], join: "" };
				});
				return { slices: [], metadata: { ...m.metadata }, tags: [] };
			});
			tagIds.set({ ids: [] });
		}}>
		<div class="inline">All instances</div>
		<div class="inline">
			<SliceCellResult
				compare={$tab === "comparison"}
				slice={undefined}
				sliceModel={$model} />
			{#if $tab === "comparison"}
				<SliceCellResult
					compare={true}
					slice={undefined}
					sliceModel={$comparisonModel} />
			{/if}
			<div style:width="36px" />
		</div>
	</div>

	{#each $folders as folder}
		<FolderCell {folder} />
	{/each}

	{#each [...$slices.values()].filter((s) => s.folder === "" && s.sliceName !== "All Instances") as s (s.sliceName)}
		<SliceCell compare={$tab === "comparison"} slice={s} />
	{/each}

	<div id="tag-header" class="inline" style:margin-top="10px">
		<div class="inline">
			<h4>Tags</h4>
			<div
				class="information-tooltip"
				use:tooltip={{
					content: "Tags are named sets of data instances.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<Icon component={Svg} viewBox="-6 -6 36 36">
					<path d={mdiInformationOutline} />
				</Icon>
			</div>
		</div>
		{#if $tab !== "comparison"}
			<div class="inline">
				<div>
					<div
						use:tooltip={{
							content: "Create a new tag.",
							position: "left",
							theme: "zeno-tooltip",
						}}>
						<IconButton on:click={() => showNewTag.update((b) => !b)}>
							<Icon component={Svg} viewBox="0 0 24 24">
								{#if $selectionIds.ids.length > 0}
									<path fill="var(--N1)" d={mdiPlusCircle} />
								{:else}
									<path fill="black" d={mdiPlus} />
								{/if}
							</Icon>
						</IconButton>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#each [...$tags.values()] as t}
		{#if $editId === t.tagName}
			<div style="display: flex; align-items: center">
				<div style="width: 100%; margin-right: 10px">
					<TagCell tag={t} />
				</div>
				<Button
					style="background-color: var(--N1); margin-top: 5px; color: white; "
					on:click={() => {
						createNewTag($editId, { ids: $editedIds }).then(() => {
							tags.update((t) => {
								t.set($editId, {
									tagName: $editId,
									folder: "",
									selectionIds: { ids: $editedIds },
								});
								return t;
							});
							editId.set(undefined);
							editedIds.set([]);

							// update tag IDs if a selected tag was edited
							let s = new Set();
							//this is to catch for the case when you have intersections between tags
							//must come after selections is updated
							$selections.tags.forEach((tag) =>
								$tags.get(tag).selectionIds.ids.forEach((id) => s.add(id))
							);
							let finalArray = [];
							s.forEach((id) => finalArray.push(id));
							tagIds.set({ ids: finalArray });
						});
					}}>Done</Button>
			</div>
		{:else}
			<TagCell tag={t} />
		{/if}
	{/each}
	{#if $tab !== "comparison"}
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
				(m) => m.columnType === ZenoColumnType.OUTPUT && m.model === $model
			)}
			{#if outputCol.length > 0}
				<MetadataCell
					col={outputCol[0]}
					histogram={metadataHistograms.get(outputCol[0])} />
			{/if}
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
	#tag-header {
		border-bottom: 0.5px solid var(--G5);
		background-color: var(--Y2);
	}
	#metric-header {
		position: sticky;
		top: 40px;
		z-index: 2;
		border-bottom: 0.5px solid var(--G5);
		background-color: var(--Y2);
	}
	#side-container {
		height: calc(100vh - 65px);
		width: 360px;
		min-width: 360px;
		max-width: 360px;
		padding-top: 10px;
		padding-bottom: 50px;
		padding-left: 15px;
		padding-right: 10px;
		overflow-y: scroll;
		background-color: var(--Y2);
	}
	.inline {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.compare-slice-cell {
		padding-top: 5px;
		padding-bottom: 5px;
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
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
