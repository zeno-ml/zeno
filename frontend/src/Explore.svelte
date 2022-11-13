<script lang="ts">
	import { filteredTable, ready, table } from "./stores";

	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import Samples from "./general/Samples.svelte";
	import OptionsBar from "./general/OptionsBar.svelte";
	import RowTable from "./general/RowTable.svelte";
	import {shouldUseRowTable} from "./stores";

</script>

{#if $ready && $table.size > 0}
	<OptionsBar />
	<div id="container">
		<MetadataPanel />
		{#if $shouldUseRowTable}
		<div id="filtered-table" style:width="100%" style:padding-left="10px">
			<RowTable table={$filteredTable}/>
		</div>
		{:else}
		<div id="samples" style:width="100%" style:padding-left="10px">
			<Samples table={$filteredTable} />
		</div>
		{/if}
	</div>
{/if}

<style>
	#samples {
		width: 100%;
		margin-right: 20px;
	}
	#filtered-table {
		width: 100%;
		margin-right: 20px;
	}
	#container {
		display: flex;
		flex-direction: row;
		min-width: 100%;
	}
</style>
