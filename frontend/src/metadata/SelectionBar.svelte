<script lang="ts">
	import { TrailingIcon } from "@smui/chips";
	import { columnHash, getMetricsForSlices } from "../util/util";

	import {
		table,
		filteredTable,
		metadataSelections,
		metric,
		model,
		sliceSelections,
		transform,
		settings,
		lassoSelection,
	} from "../stores";
	import { MetadataType } from "../globals";

	async function updateResult(model, metric, transform, filteredTable) {
		if (filteredTable.size === 0) {
			return;
		}

		let name = "";
		if ($table.size === filteredTable.size) {
			name = "overall";
		}

		let idxs = filteredTable.array(columnHash($settings.idColumn));
		let sli = <Slice>{ sliceName: name, folder: "", idxs: idxs };

		return getMetricsForSlices([
			<MetricKey>{
				sli: sli,
				metric: metric,
				model: model,
				transform: transform,
			},
		]);
	}

	$: result = updateResult($model, $metric, $transform, $filteredTable);
</script>

<div class="chips">
	<span id="metric">
		{$metric ? $metric + ":" : ""}
		{#await result then res}
			{res && res[0] !== undefined && res[0] !== null ? res[0].toFixed(2) : ""}
		{/await}
	</span>
	<span id="size">
		({$filteredTable.size} instances)
	</span>
	{#each $sliceSelections as s}
		<div class="meta-chip">
			{s}
			<TrailingIcon
				class="remove material-icons"
				on:click={() =>
					sliceSelections.update((sel) => {
						sel.splice(sel.indexOf(s), 1);
						return sel;
					})}>
				cancel
			</TrailingIcon>
		</div>
	{/each}
	{#each [...$metadataSelections.entries()] as [hash, chip]}
		<div class="meta-chip">
			<span>
				{#if chip.column.metadataType === MetadataType.CONTINUOUS}
					{chip.values[0].toFixed(2)}
					{"<"}
					{chip.column.name}
					{"<"}
					{chip.values[1].toFixed(2)}
				{:else if chip.column.metadataType === MetadataType.BOOLEAN}
					{chip.values[0]}
					{chip.column.name}
				{:else if chip.column.metadataType === MetadataType.DATETIME}
					{#if !chip.values[1]}
						start {chip.values[0].toLocaleString()}
					{:else if !chip.values[0]}
						end {chip.values[0].toLocaleString()}
					{:else}
						from {chip.values[0].toLocaleString()} to {chip.values[1].toLocaleString()}
					{/if}
				{:else}
					{chip.column.name}
					{"=="}
					{chip.values.join(" | ")}
				{/if}
			</span>
			<TrailingIcon
				class="remove material-icons"
				on:click={() =>
					metadataSelections.update((m) => {
						m.delete(hash);
						return m;
					})}>
				cancel
			</TrailingIcon>
		</div>
	{/each}
	{#if $lassoSelection !== null}
		<div class="meta-chip lasso">
			Lasso Selection
			<TrailingIcon
				class="remove material-icons"
				on:click={() => {
					lassoSelection.set(null);
				}}>
				cancel
			</TrailingIcon>
		</div>
	{/if}
	{#if $metadataSelections.size + $sliceSelections.length > 0 || $lassoSelection !== null}
		<span
			class="clear"
			on:click={() => {
				metadataSelections.set(new Map());
				sliceSelections.set([]);
				lassoSelection.set(null);
			}}>
			clear all
		</span>
	{/if}
</div>

<style>
	.chips {
		display: flex;
		flex-direction: inline;
		flex-wrap: wrap;
		height: fit-content;
		align-items: center;
		min-height: 40px;
		padding-bottom: 5px;
		padding-top: 5px;
		border-bottom: 1px solid #e0e0e0;
	}
	#metric {
		font-weight: 400;
		color: #6a1b9a;
		margin-right: 15px;
	}
	.meta-chip {
		padding: 5px;
		background: #f8f8f8;
		border: 1px solid #e8e8e8;
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
	.clear {
		padding: 5px;
		margin-left: 10px;
		cursor: pointer;
		color: #6a1b9a;
	}
	.clear:hover {
		background: #ede1fd;
		border-radius: 5px;
	}
	#size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
	.lasso {
		--color: 277, 70%, 35%;
		background: hsla(var(--color), 0.1);
		border: 1px solid hsl(var(--color));
	}
</style>
