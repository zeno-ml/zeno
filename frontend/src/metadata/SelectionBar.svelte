<script lang="ts">
	import { mdiRefresh } from "@mdi/js";
	import Button, { Group, Icon } from "@smui/button";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { onMount } from "svelte";
	import {
		metric,
		editId,
		editedIds,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
		status,
		tagIds,
		tags,
	} from "../stores";
	import { ZenoService, type FilterPredicate } from "../zenoservice";
	import IdsChip from "./chips/IdsChip.svelte";
	import MetadataChip from "./chips/MetadataChip.svelte";
	import SliceChip from "./chips/SliceChip.svelte";
	import TagChip from "./chips/TagChip.svelte";
	import { createNewTag } from "../api/tag";

	export let currentResult;
	export let selected = "list";
	export let optionsFunction;
	export let viewOptions;

	let CHOICES;

	let optionsDiv: HTMLDivElement;
	let mounted = false;
	let runningAnalysis = true;

	$: if (mounted && optionsDiv && optionsFunction) {
		optionsFunction(optionsDiv, (opts) => (viewOptions = opts));
	}

	$: CHOICES =
		$editId === undefined
			? $settings.view !== ""
				? ["list", "table", "comparison", "projection"]
				: ["table", "projection"]
			: ["table"];

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
							tagIds.set({ ids: [] });
						}}>
						clear all
					</span>
				{/if}
			{/if}
		</div>
		<div class="status inline">
			{#if runningAnalysis}
				<span style="margin-right: 10px">{@html $status.status}</span>
				<CircularProgress
					class="status-circle"
					style="height: 32px; width: 32px; margin-right:20px"
					indeterminate />
			{:else}
				<div
					on:keydown={() => ({})}
					on:click={() =>
						ZenoService.refreshData().then(() => {
							location.reload();
						})}
					use:tooltip={{
						content: "Refresh data & functions",
						position: "left",
						theme: "zeno-tooltip",
					}}>
					<div class="icon">
						<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
							<path d={mdiRefresh} />
						</Icon>
					</div>
				</div>
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
			{#if $editId === undefined}
				{#if optionsFunction}
					<div style:margin-right="20px" bind:this={optionsDiv} />
				{/if}
				<Group>
					{#each CHOICES as choice}
						<Button
							style="background-color: {selected === choice
								? 'var(--G5)'
								: 'var(--G6)'}"
							variant="outlined"
							on:click={() => (selected = choice)}>{choice}</Button>
					{/each}
				</Group>
			{:else}
				<div class="inline" style="margin-right: 10px">
					<p style="margin: auto; margin-right: 10px">Editing</p>
					<div class="meta-chip">{$editId}</div>
				</div>
				<Button
					style="background-color: var(--N1)"
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
			{/if}
		</div>
	</div>
</div>

<style>
	p {
		margin: 0px;
	}
	.icon {
		cursor: pointer;
		width: 24px;
		height: 24px;
		fill: var(--G1);
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
	.meta-chip {
		padding: 5px 10px;
		background: var(--N2);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 4px;
		width: fit-content;
		margin: auto;
	}
</style>
