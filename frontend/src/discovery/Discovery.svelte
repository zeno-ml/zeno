<script lang="ts">
	/**
	 * Discovery.svelte (V2)
	 * The first part of Zeno dedicated to finding blindspots from the data
	 * representations. This is the top-level parent component for all things discovery
	 */

	import MetadataPanel from "../metadata/MetadataPanel.svelte";
	import EmbedView from "./EmbedView.svelte";
	import { table, filteredTable } from "../stores";
	import Samples from "../general/Samples.svelte";

	$: tableEmpty = $table.size === 0;
</script>

<main>
	{#if !tableEmpty}
		<div id="sidebar-view">
			<MetadataPanel />
		</div>

		<div id="main-view">
			<div id="embed-view">
				<EmbedView />
			</div>
			<div id="samples-view">
				<Samples table={$filteredTable} />
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
	}

	#sidebar-view {
		outline: 1px solid salmon;
	}

	#main-view {
		outline: 1px solid cyan;
	}
</style>
