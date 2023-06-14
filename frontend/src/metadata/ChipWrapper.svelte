<script lang="ts">
	import {
		selectionIds,
		selectionPredicates,
		selections,
		tagIds,
	} from "../stores";
	import { type FilterPredicate } from "../zenoservice";
	import IdsChip from "./chips/IdsChip.svelte";
	import MetadataChip from "./chips/MetadataChip.svelte";
	import SliceChip from "./chips/SliceChip.svelte";
	import TagChip from "./chips/TagChip.svelte";

	$: filters = Object.entries($selections.metadata)
		.filter(([, value]) => value.predicates.length > 0)
		.map(
			([key, value]) =>
				[key, value.predicates as unknown] as [string, FilterPredicate[]]
		);
</script>

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
					tagIds.set({ ids: [] });
				}}>
				clear all
			</span>
		{/if}
	{/if}
</div>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		height: fit-content;
		align-items: center;
		min-height: 40px;
		padding-bottom: 5px;
		padding-top: 5px;
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
</style>
