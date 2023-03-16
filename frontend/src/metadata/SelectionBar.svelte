<script lang="ts">
	import Button, { Group } from "@smui/button";
	import CircularProgress from "@smui/circular-progress";
	import { onMount } from "svelte";
	import {
		metric,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
		status,
		tagIds,
	} from "../stores";
	import type { FilterPredicate } from "../zenoservice";
	import IdsChip from "./chips/IdsChip.svelte";
	import MetadataChip from "./chips/MetadataChip.svelte";
	import SliceChip from "./chips/SliceChip.svelte";
  	import TagChip from "./chips/TagChip.svelte";

	export let currentResult;
	export let selected = "list";
	export let optionsFunction;
	export let viewOptions;

	let CHOICES =
		$settings.view !== ""
			? ["list", "table", "comparison", "projection"]
			: ["table", "projection"];

	let optionsDiv: HTMLDivElement;
	let mounted = false;
	let runningAnalysis = true;

	$: if (mounted && optionsDiv && optionsFunction) {
		optionsFunction(optionsDiv, (opts) => (viewOptions = opts));
	}

	$: filters = Object.entries($selections.metadata)
		.filter(([, value]) => value.predicates.length > 0)
		.map(
			([key, value]) =>
				[key, value.predicates as unknown] as [string, FilterPredicate[]]
		);

	status.subscribe((s) => {
		if (s.status.startsWith("Done")) {
			runningAnalysis = false;
		} else {
			runningAnalysis = true;
		}
	});

	onMount(() => (mounted = true));
</script>

<div style:width="100%">
	<div class="between">
		<div class="chips">
			{#if $selections.slices.length + $selections.tags.length + filters.length === 0 && $selectionIds.ids.length === 0}
				<p>Filter with the metadata distributions.</p>
			{:else}
				{#each $selections.slices as slice}
					<SliceChip {slice} />
				{/each}
				{#each filters as [hash, chip]}
					<MetadataChip {hash} {chip} />
				{/each}
				{#each $selections.tags as tag}
					<TagChip {tag} />
				{/each}
				{#if $selectionIds.ids.length > 0}
					<IdsChip />
				{/if}
				{#if $selectionPredicates.predicates.length > 0 || $tagIds.ids.length > 0 || $selectionIds.ids.length > 0}
					<span
						class="clear"
						on:keydown={() => ({})}
						on:click={() => {
							selections.update((m) => {
								Object.keys(m.metadata).forEach((key) => {
									m.metadata[key] = {
										predicates: [],
										join: "",
									};
								});
								return { slices: [], metadata: { ...m.metadata }, tags: [] };
							});
							selectionIds.set({ ids: [] });
							tagIds.set({ids: []})
						}}>
						clear all
					</span>
				{/if}
			{/if}
		</div>
		<div class="status inline">
			{#if runningAnalysis}
				<CircularProgress
					class="status-circle"
					style="height: 32px; width: 32px; margin-right:20px"
					indeterminate />
				<span>{@html $status.status}</span>
			{/if}
		</div>
	</div>
	<div class="options">
		<div>
			{#await currentResult then r}
				{#if r}
					{#if r[0].metric !== undefined && r[0].metric !== null}
						<span class="metric">
							{$metric ? $metric + ":" : ""}
						</span>
						<span class="metric-value">
							{r[0].metric.toFixed(2)}
						</span>
					{/if}
					<span id="size">({r[0].size.toLocaleString()} instances)</span>
				{/if}
			{/await}
		</div>
		<div class="inline">
			{#if optionsFunction}
				<div style:margin-right="20px" bind:this={optionsDiv} />
			{/if}
			<Group>
				{#each CHOICES as choice}
					<Button
						style="background-color: {selected === choice
							? 'var(--G5)'
							: 'var(--G6'}"
						variant="outlined"
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
	.between {
		padding-top: 10px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
		border-bottom: 1px solid var(--G5);
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
		border-bottom: 1px solid var(--G5);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		height: fit-content;
		align-items: center;
		min-height: 40px;
		padding-bottom: 5px;
		padding-top: 5px;
	}
	.metric {
		font-weight: 400;
		color: var(--G2);
		margin-right: 15px;
	}
	.metric-value {
		font-weight: 400;
		color: var(--logo);
		margin-right: 15px;
	}
	.clear {
		padding: 5px;
		margin-left: 10px;
		cursor: pointer;
		color: var(--G3);
	}
	.clear:hover {
		background: var(--Y1);
		border-radius: 4px;
	}
	#size {
		font-style: italic;
		color: var(--G3);
		margin-right: 10px;
	}
	.inline {
		display: flex;
		align-items: center;
	}
</style>
