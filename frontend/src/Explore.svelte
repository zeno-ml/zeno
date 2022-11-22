<script lang="ts">
	import { status, filteredTable, ready } from "./stores";

	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import OptionsBar from "./general/OptionsBar.svelte";
	import InstanceView from "./instance-views/InstanceView.svelte";
</script>

{#if $ready && $status.completeColumns.length > 0}
	<OptionsBar />
	<div id="container">
		<MetadataPanel />

		<div id="samples" style:width="100%" style:padding-left="10px">
			<InstanceView table={$filteredTable} />
		</div>
	</div>
{/if}

<style>
	#samples {
		width: 100%;
		margin-right: 20px;
	}
	#container {
		display: flex;
		flex-direction: row;
		min-width: 100%;
	}
</style>
