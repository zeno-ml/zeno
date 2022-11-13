<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import {
		filteredTable,
		metadataSelections,
		metric,
		sliceSelections,
		lassoSelection,
		zenoState,
	} from "../stores";
	import { MetadataType } from "../globals";
	import { getMetricsForSlices } from "../api";

	$: filters = Object.entries($metadataSelections)
		.filter(([_, value]) => value.predicates.length > 0)
		.map(
			([key, value]) =>
				[key, value.predicates as unknown] as [string, FilterPredicate[]]
		);

	$: res = getMetricsForSlices([
		<MetricKey>{
			sli: <Slice>{
				sliceName: "",
				folder: "",
				filterPredicates: {
					predicates: Object.values($metadataSelections).filter(
						(value) => value.predicates.length > 0
					),
					join: "",
				},
			},
			state: $zenoState,
		},
	]);
</script>

<div class="chips">
	<span id="metric">
		{$metric ? $metric + ":" : ""}
		{#await res then r}
			{r && r[0] !== null && r[0] !== undefined ? r[0].toFixed(2) : ""}
		{/await}
	</span>
	<span id="size">
		({$filteredTable.length} instances)
	</span>

	{#if $lassoSelection.length > 0}
		<div class="meta-chip lasso">Viewing Selected Data</div>
	{:else}
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
		{#each filters as [hash, chip]}
			<div class="meta-chip">
				<span>
					{#if chip[0].column.metadataType === MetadataType.CONTINUOUS}
						{parseFloat(chip[0].value).toFixed(2)}
						{"<"}
						{chip[0].column.name}
						{"<"}
						{parseFloat(chip[1].value).toFixed(2)}
					{:else if chip[0].column.metadataType === MetadataType.BOOLEAN}
						{chip[0].value}
						{chip[0].column.name}
					{:else if chip[0].column.metadataType === MetadataType.DATETIME}
						{#if !chip[0].value}
							start {chip[0].value.toLocaleString()}
						{:else if !chip[0].value}
							end {chip[0].value.toLocaleString()}
						{:else}
							from {chip[0].value.toLocaleString()} to {chip.values[1].toLocaleString()}
						{/if}
					{:else}
						{chip[0].column.name}
						{"=="}
						{chip.map((c) => c.value).join(" | ")}
					{/if}
				</span>
				<TrailingIcon
					class="remove material-icons"
					on:click={() =>
						metadataSelections.update((m) => ({
							...m,
							[hash]: { predicates: [], join: "&" },
						}))}>
					cancel
				</TrailingIcon>
			</div>
		{/each}
		{#if Object.values($metadataSelections)
			.map((d) => d.predicates)
			.flat().length + $sliceSelections.length > 0}
			<span
				class="clear"
				on:keydown={() => ({})}
				on:click={() => {
					sliceSelections.set([]);
					metadataSelections.update((m) => {
						for (let key in m) {
							m[key] = { predicates: [], join: "&" };
						}
						return { ...m };
					});
				}}>
				clear all
			</span>
		{/if}
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
