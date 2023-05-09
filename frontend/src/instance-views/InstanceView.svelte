<script lang="ts">
	import { onMount } from "svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import ListView from "./ListView.svelte";
	import ComparisonView from "./ComparisonView.svelte";
	import TableView from "./TableView.svelte";
	import ScatterView from "./scatter-view/ScatterView.svelte";
	import { getMetricsForSlicesAndTags } from "../api/slice";
	import {
		editId,
		selections,
		selectionIds,
		selectionPredicates,
		tagIds,
		settings,
		model,
		metric,
	} from "../stores";
	import type { MetricKey, Slice } from "../zenoservice";

	let selected = location.hash === "#/comparison/" ? "comparison" : "list";

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
			let import_path =
				location.protocol +
				"//" +
				location.host +
				location.pathname +
				"cache/view.mjs";
			import(import_path).then((m) => {
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

	$: currentResult = getMetricsForSlicesAndTags(
		[
			<MetricKey>{
				sli: <Slice>{
					sliceName: "",
					folder: "",
					filterPredicates: {
						predicates: [$selectionPredicates],
						join: "",
					},
				},
				model: $model,
				metric: $metric,
			},
		],
		$tagIds,
		$selectionIds,
		$selections.tags
	);
	// change selected to table if a tag is edited
	$: selected = $editId !== undefined ? "table" : selected;
</script>

<div class="heading">
	<SelectionBar
		bind:selected
		{optionsFunction}
		{currentResult}
		bind:viewOptions />
</div>
{#if location.hash !== "#/comparison/"}
	{#if $editId !== undefined}
		<TableView {currentResult} {viewFunction} {viewOptions} />
	{:else}
		{#if selected === "list" && viewOptions !== undefined}
			<ListView {currentResult} {viewFunction} {viewOptions} />
		{/if}
		{#if selected === "table"}
			<TableView {currentResult} {viewFunction} {viewOptions} />
		{/if}
		{#if selected === "projection"}
			<ScatterView {viewFunction} {viewOptions} />
		{/if}
	{/if}
{:else}
	<ComparisonView {currentResult} {viewFunction} {viewOptions} />
{/if}

<style>
	.heading {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
</style>
