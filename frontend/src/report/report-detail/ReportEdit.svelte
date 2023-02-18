<script lang="ts">
	import { ready } from "../../stores";
	import ReportDetail from "./ReportDetail.svelte";

	export let params;
</script>

<main>
	{#if $ready}
		<ReportDetail {params} />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 80px);
	}
</style>
