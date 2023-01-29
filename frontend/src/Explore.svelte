<script lang="ts">
	import InstanceView from "./instance-views/InstanceView.svelte";
	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import { filteredTable, ready, status } from "./stores";
</script>

{#if $ready && $status.completeColumns.length > 0}
	<div class="container">
		<MetadataPanel />

		<div id="samples" style:width="100%">
			<InstanceView table={$filteredTable} />
		</div>
	</div>
{/if}

<style>
	#samples {
		width: 100%;
		margin-right: 20px;
		margin-left: 20px;
	}
	.container {
		display: flex;
		flex-direction: row;
	}
</style>
