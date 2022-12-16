<script lang="ts">
	import { checkEmbedExists } from "../api";
	import { model, transform } from "../stores";
	import { onMount } from "svelte";

	export let currentResult;
	export let table;
	export let viewFunction;
	export let viewOptions = {};

	let embedExists = false;

	onMount(async () => {
		embedExists = await checkEmbedExists($model, $transform);
	});
</script>

{#if embedExists}
	<div>Embed View</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
</style>
