<script lang="ts">
	import { onMount } from "svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import ListView from "./ListView.svelte";
	import TableView from "./TableView.svelte";
	import EmbedView from "./EmbedView.svelte";
	import { getMetricsForSlices } from "../api";
	import { zenoState, selectionPredicates } from "../stores";

	export let table;

	let selected = "embed";

	let viewOptions = undefined;
	let viewFunction;
	let optionsFunction;

	onMount(() => {
		try {
			import(window.location.origin + "/cache/view.mjs").then((m) => {
				if (m.getOptions) {
					optionsFunction = m.getOptions;
				} else {
					viewOptions = {};
				}
				viewFunction = m.getInstance;
			});
		} catch (e) {
			console.log("ERROR: failed to load sample view ---", e);
		}
	});

	$: currentResult = getMetricsForSlices([
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

<div class="heading">
	<SelectionBar
		bind:selected
		{optionsFunction}
		{currentResult}
		bind:viewOptions />
</div>

{#if selected === "list" && viewOptions !== undefined}
	<ListView {currentResult} {table} {viewFunction} {viewOptions} />
{/if}
{#if selected === "table"}
	<TableView {currentResult} {table} {viewFunction} {viewOptions} />
{/if}
{#if selected === "embed"}
	<EmbedView {currentResult} {table} {viewFunction} {viewOptions} />
{/if}

<style>
	.heading {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
</style>
