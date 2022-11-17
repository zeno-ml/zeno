<script lang="ts">
	import Button, { Group } from "@smui/button";
	import { onMount } from "svelte";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import ListView from "./ListView.svelte";
	import TableView from "./TableView.svelte";

	export let table;

	let CHOICES = ["list", "table"];
	let selected = "list";

	let viewFunction;
	let optionsDiv;
	let viewOptions;

	onMount(() => {
		try {
			import(window.location.origin + "/cache/view.mjs").then((m) => {
				viewFunction = m.getInstance;
				if (m.getOptions) {
					m.getOptions(optionsDiv, (opts) => (viewOptions = opts));
				}
			});
		} catch (e) {
			console.log("ERROR: failed to load sample view ---", e);
		}
	});
</script>

<div class="heading">
	<SelectionBar />
	<div bind:this={optionsDiv} />
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
{#if selected === "list"}
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
