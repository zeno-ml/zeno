<script lang="ts">
	import { TrailingIcon } from "@smui/chips";
	import Button, { Group } from "@smui/button";

	import {
		selections,
		metric,
		zenoState,
		selectionPredicates,
	} from "../stores";
	import { MetadataType } from "../globals";
	import { getMetricsForSlices } from "../api";

	export let selected = "list";

	let CHOICES = ["list", "table"];

	$: filters = Object.entries($selections.metadata)
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
					predicates: $selectionPredicates,
					join: "",
				},
			},
			state: $zenoState,
		},
	]);
</script>

<div style:width="100%">
	<div class="chips">
		{#if $selections.slices.length + filters.length === 0}
			<p>Filter with the metadata distributions.</p>
		{:else}
			{#each $selections.slices as s}
				<div class="meta-chip">
					{s}
					<TrailingIcon
						class="remove material-icons"
						on:click={() =>
							selections.update((sel) => {
								sel.slices.splice(sel.slices.indexOf(s), 1);
								return { slices: sel.slices, metadata: sel.metadata };
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
							selections.update((m) => ({
								slices: m.slices,
								metadata: {
									...m.metadata,
									[hash]: { predicates: [], join: "&" },
								},
							}))}>
						cancel
					</TrailingIcon>
				</div>
			{/each}
			{#if $selectionPredicates.length > 0}
				<span
					class="clear"
					on:keydown={() => ({})}
					on:click={() => {
						selections.update((m) => {
							for (let key in m.metadata) {
								m.metadata[key] = { predicates: [], join: "&" };
							}
							return { slices: [], metadata: { ...m.metadata } };
						});
					}}>
					clear all
				</span>
			{/if}
		{/if}
	</div>
	<div class="options">
		<div>
			<span class="metric">
				{$metric ? $metric + ":" : ""}
			</span>
			{#await res then r}
				<span class="metric"
					>{r[0].metric !== undefined ? r[0].metric.toFixed(2) : ""}</span>
				<span id="size">({r[0].size} instances)</span>
			{/await}
		</div>
		<div>
			<Group>
				{#each CHOICES as choice}
					<Button
						variant={choice === selected ? "raised" : "outlined"}
						on:click={() => (selected = choice)}>{choice}</Button>
				{/each}
			</Group>
		</div>
	</div>
</div>

<style>
	p {
		margin: 0px;
	}
	.options {
		display: flex;
		flex-direction: inline;
		flex-wrap: wrap;
		justify-content: space-between;
		width: 100%;
		align-items: center;
		padding-top: 10px;
		padding-bottom: 10px;
		border-bottom: 1px solid #e0e0e0;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		height: fit-content;
		align-items: center;
		min-height: 40px;
		padding-bottom: 5px;
		padding-top: 5px;
		border-bottom: 1px solid #e0e0e0;
	}
	.metric {
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
</style>
