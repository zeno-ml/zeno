<script lang="ts">
	import { onMount } from "svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import ListView from "./ListView.svelte";
	import TableView from "./TableView.svelte";
	import ScatterView from "./scatter-view/ScatterView.svelte";
	import { getMetricsForSlices } from "../api/slice";
	import {
		selectionIds,
		selectionPredicates,
		settings,
		model,
		metric,
	} from "../stores";
	import type { MetricKey, Slice } from "../zenoservice";

	export let table;

	let selected = "list";

	let viewOptions = undefined;
	/**
	 * View component generators
	 * that when called with a div html argument
	 * inject content into that div
	 *
	 * See https://github.com/zeno-ml/instance-views
	 * for more details
	 */
	let viewFunction;
	let optionsFunction;

	onMount(() => {
		if ($settings.view === "") {
			selected = "table";
			return;
		}

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

	$: currentResult = getMetricsForSlices(
		[
			<MetricKey>{
				sli: <Slice>{
					sliceName: "",
					folder: "",
					filterPredicates: {
						predicates: $selectionPredicates,
						join: "",
					},
				},
				model: $model,
				metric: $metric,
			},
		],
		$selectionIds
	);
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
{#if selected === "projection"}
	<ScatterView {viewFunction} {viewOptions} />
{/if}

<style>
	.heading {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
</style>
