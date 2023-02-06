<script lang="ts">
	import ReportsList from "./report/ReportsList.svelte";
	import {ready} from "./stores";
</script>

<main>
	{#if $ready}
		<ReportsList />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 80px);
	}
</style>
