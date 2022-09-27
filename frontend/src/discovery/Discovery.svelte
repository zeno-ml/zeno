<script lang="ts">
	/**
	 * Discovery.svelte (V2)
	 * The first part of Zeno dedicated to finding blindspots from the data
	 * representations. This is the top-level parent component for all things discovery
	 */

	import MetadataPanel from "../metadata/MetadataPanel.svelte";
	import OptionsBar from "../general/OptionsBar.svelte";
	import EmbedView from "./EmbedView.svelte";
	import { table, filteredTable } from "../stores";
	import Samples from "../general/Samples.svelte";

	$: tableEmpty = $table.size === 0;
</script>

<OptionsBar />
<main>
	{#if !tableEmpty}
		<div id="sidebar-view">
			<MetadataPanel shouldColor />
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
</style>
