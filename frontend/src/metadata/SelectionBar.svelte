<script lang="ts">
	import { TrailingIcon } from "@smui/chips";
	import { columnHash, getMetricsForSlices } from "../util";

	import {
		table,
		filteredTable,
		metadataSelections,
		metric,
		model,
		sliceSelections,
		transform,
		settings,
	} from "../stores";

	async function updateResult(model, metric, transform, filteredTable) {
		if (filteredTable.size === 0) {
			return;
		}

		let name = "";
		if ($table.size === filteredTable.size) {
			name = "overall";
		}

		let idxs = filteredTable.array(columnHash($settings.idColumn));
		let sli = <Slice>{ sliceName: name, idxs: idxs };

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
			{res && res[0] ? res[0].toFixed(2) : ""}
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
				{#if chip.type === "range"}
					{chip.values[0].toFixed(2)}
					{"<"}
					{chip.column.name}
					{"<"}
					{chip.values[1].toFixed(2)}
				{:else if chip.type === "binary"}
					{chip.values[0]}
					{chip.column.name}
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
					})}>cancel</TrailingIcon>
		</div>
	{/each}
	{#if $metadataSelections.size + $sliceSelections.length > 0}
		<span
			class="clear"
			on:click={() => {
				metadataSelections.set(new Map());
				sliceSelections.set([]);
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
	}
	#metric {
		font-weight: 400;
		margin-left: 10px;
		color: #6a1b9a;
		margin-right: 15px;
	}
	.meta-chip {
		padding: 5px;
		background: rgba(0, 0, 0, 0.07);
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
		color: #6200ee;
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
</style>
