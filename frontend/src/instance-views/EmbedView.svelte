<script lang="ts">
	import { model } from "../stores";
	import { onMount } from "svelte";

	export let currentResult;
	export let table;
	export let viewFunction;
	export let viewOptions = {};

	let embedExists = false;

	onMount(async () => {
		embedExists = await checkEmbedExists($model);
	});

	async function checkEmbedExists(model: string) {
		const req = await fetch(`api/embed-exists/${model}`);
		if (req.ok) {
			const exists = (await req.json()) as boolean;
			return exists;
		} else {
			return false;
		}
	}
</script>

{#if embedExists}
	<div>Embed View</div>
{:else}
	<div>Embeddings don't exist</div>
	<div>**Instructions to add embeddings here**</div>
{/if}

<style>
</style>
