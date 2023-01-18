<script lang="ts">
	import Button, { Group } from "@smui/button";
	import CircularProgress from "@smui/circular-progress";

	import {
		settings,
		selections,
		metric,
		selectionPredicates,
		status,
	} from "../stores";
	import { onMount } from "svelte";
	import SliceChip from "./chips/SliceChip.svelte";
	import MetadataChip from "./chips/MetadataChip.svelte";

	export let currentResult;
	export let selected = "list";
	export let optionsFunction;
	export let viewOptions;

	let CHOICES =
		$settings.view !== "" ? ["list", "table", "scatter"] : ["table", "scatter"];

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
			{#if $selections.slices.length + filters.length === 0}
				<p>Filter with the metadata distributions.</p>
			{:else}
				{#each $selections.slices as slice}
					<SliceChip {slice} />
				{/each}
				{#each filters as [hash, chip]}
					<MetadataChip {hash} {chip} />
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
			<span class="metric">
				{$metric ? $metric + ":" : ""}
			</span>
			{#await currentResult then r}
				{#if r}
					<span class="metric">
						{r[0].metric !== undefined && r[0].metric !== null
							? r[0].metric.toFixed(2)
							: ""}
					</span>
					<span id="size">({r[0].size} instances)</span>
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
	.between {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
		border-bottom: 1px solid #e0e0e0;
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
	}
	.metric {
		font-weight: 400;
		color: #6a1b9a;
		margin-right: 15px;
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
	.inline {
		display: flex;
		align-items: center;
	}
</style>
