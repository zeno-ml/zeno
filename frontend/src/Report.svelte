<script lang="ts">
	import ReportHome from "./report/ReportHome.svelte";
	import { ready } from "./stores";
</script>

<main>
	{#if $ready}
		<ReportHome />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 80px);
	}
</style>
