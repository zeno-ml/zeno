<script lang="ts">
	import { onMount } from "svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import ListView from "./ListView.svelte";
	import TableView from "./TableView.svelte";

	export let table;

	let selected = "list";

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
</script>

<div class="heading">
	<SelectionBar bind:selected {optionsFunction} bind:viewOptions />
</div>

{#if selected === "list" && viewOptions !== undefined}
	<ListView {table} {viewFunction} {viewOptions} />
{/if}
{#if selected === "table"}
	<TableView {table} {viewFunction} {viewOptions} />
{/if}

<style>
	.heading {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
</style>
