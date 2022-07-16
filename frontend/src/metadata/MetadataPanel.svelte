<script lang="ts">
	import Button, { Icon } from "@smui/button";
	import { Svg } from "@smui/common/elements";
	import * as aq from "arquero";
	import type ColumnTable from "arquero/dist/types/table/column-table";

	import { mdiTableMultiple } from "@mdi/js";
	import Ripple from "@smui/ripple";
	import CreateSlice from "../filtering/CreateSlice.svelte";
	import MetadataNode from "./MetadataCell.svelte";
	import SliceNode from "./SliceCell.svelte";

	import { clickOutside } from "../clickOutside";
	import {
		filteredTable,
		metadataSelections,
		model,
		ready,
		settings,
		slices,
		sliceSelections,
		sort,
		table,
		metric,
		transform,
	} from "../stores";
	import {
		columnHash,
		getFilterFromPredicates,
		getMetricsForSlices,
		updateSliceIdxs,
	} from "../util";
	import { ZenoColumnType } from "../globals";

	let name = "";
	let newSlice = false;
	let mode = "create";
	let predicates: FilterPredicate[] = [];

	table.subscribe((t) => updateFilteredTable(t));
	metadataSelections.subscribe(() => updateFilteredTable($table));
	sliceSelections.subscribe(() => updateFilteredTable($table));

	function updateFilteredTable(t: ColumnTable) {
		if (!$ready || $table.size === 0) {
			return;
		}
		let tempTable = t;

		// Filter with slices.
		$sliceSelections.forEach((s) => {
			let filt = getFilterFromPredicates($slices.get(s).filterPredicates);
			tempTable = tempTable.filter(`(d) => ${filt}`);
		});

		// Filter with metadata selections.
		[...$metadataSelections.entries()].forEach((e) => {
			let [hash, entry] = e;
			if (entry.type === "range") {
				tempTable = tempTable.filter(
					`(r) => r["${hash}"] > ${entry.values[0]} && r["${hash}"] < ${entry.values[1]}`
				);
			} else if (entry.type === "binary") {
				if (entry.values[0] === "is") {
					tempTable = tempTable.filter(`(r) => r["${hash}"] == 1`);
				} else {
					tempTable = tempTable.filter(`(r) => r["${hash}"] == 0`);
				}
			} else {
				tempTable = tempTable.filter(
					aq.escape((r) => aq.op.includes(entry.values, r[hash], 0))
				);
			}
		});

		if ($sort) {
			tempTable = tempTable.orderby(columnHash($sort));
		}

		filteredTable.set(tempTable);
		return tempTable;
	}

	function editSlice(sli: Slice) {
		predicates = sli.filterPredicates;
		name = sli.sliceName;
		mode = "edit";
		newSlice = true;
	}

	model.subscribe(() => updateSliceIdxs());

	$: res = getMetricsForSlices([
		<MetricKey>{
			sli: <Slice>{
				sliceName: "overall",
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
		use:Ripple={{ surface: true, color: "primary" }}
		class={"overview " +
			($sliceSelections.length + $metadataSelections.size === 0
				? "selected"
				: "")}
		on:click={() => {
			sliceSelections.set([]);
			metadataSelections.set(new Map());
		}}>
		<div class="inline">
			<div class="icon">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiTableMultiple} />
				</Icon>
			</div>
			<p>all instances</p>
		</div>
		<div>
			<span>{#await res then r}{r && r[0] ? r[0].toFixed(2) : ""}{/await}</span>
			<span class="size">({$table.size})</span>
		</div>
	</div>

	<h4>Weak Labels</h4>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.WEAK_LABEL) as col}
		<MetadataNode {col} />
	{:else}
		No weak labels yet.
	{/each}

	<div class="inline">
		<h4>Slices</h4>
		<div style:margin-right="13px">
			<Button
				variant="outlined"
				on:click={() => {
					predicates = [];
					name = "";
					newSlice = true;
				}}>
				New Slice
			</Button>
		</div>
	</div>
	{#if newSlice}
		<div
			use:clickOutside
			on:click_outside={() => {
				mode = "create";
				newSlice = false;
			}}>
			<CreateSlice bind:newSlice bind:predicates bind:mode bind:name />
		</div>
	{/if}

	{#each [...$slices.values()] as s}
		<SliceNode
			slice={s}
			{editSlice}
			selected={$sliceSelections.includes(s.sliceName)}
			setSelected={(e) => {
				if (
					$sliceSelections.length === 1 &&
					$sliceSelections.includes(s.sliceName)
				) {
					sliceSelections.set([]);
					return;
				}
				if (e.shiftKey) {
					if ($sliceSelections.includes(s.sliceName)) {
						sliceSelections.update((sel) => {
							sel.splice(sel.indexOf(s.sliceName), 1);
							return [...sel];
						});
					} else {
						sliceSelections.update((slis) => [...slis, s.sliceName]);
					}
				} else {
					if ($sliceSelections.includes(s.sliceName)) {
						if ($sliceSelections.length > 0) {
							sliceSelections.set([s.sliceName]);
						} else {
							sliceSelections.update((sel) => {
								sel.splice(sel.indexOf(s.sliceName), 1);
								return [...sel];
							});
						}
					} else {
						sliceSelections.set([s.sliceName]);
					}
				}
			}} />
	{/each}

	<h4>Metadata</h4>
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.METADATA) as col}
		<MetadataNode {col} />
	{/each}

	{#if $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL).length > 0}
		<h4>Distilled Metadata</h4>
	{/if}
	{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.PREDISTILL) as col}
		<MetadataNode {col} />
	{/each}
	{#if $model}
		{#each $settings.metadataColumns.filter((m) => m.columnType === ZenoColumnType.POSTDISTILL && m.model === $model) as col}
			<MetadataNode {col} />
		{/each}
	{/if}

	<div style:height="50px" />
</div>

<style>
	h4 {
		font-weight: 500;
		color: rgba(0, 0, 0, 0.7);
	}
	.side-container {
		height: calc(100vh - 80px);
		overflow-y: auto;
		min-width: 450px;
		padding: 10px;
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
		border-bottom: 0.5px solid rgb(224, 224, 224);
		border-top: 0.5px solid rgb(224, 224, 224);
		padding-left: 10px;
		justify-content: space-between;
		padding-right: 10px;
		margin-right: 10px;
	}
	.selected {
		background: #ebdffc;
	}
	.size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
</style>
