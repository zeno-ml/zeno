<script lang="ts">
	import InstanceView from "./instance-views/InstanceView.svelte";
	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import NewFolderPopup from "./metadata/popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./metadata/popups/NewSlicePopup.svelte";
	import { ready, showNewFolder, showNewSlice, status } from "./stores";
</script>

{#if $ready && $status.completeColumns.length > 0}
	<!-- These popups are at the top level b/c of issues with overflow-y scroll. -->
	{#if $showNewSlice}
		<NewSlicePopup />
	{/if}
	{#if $showNewFolder}
		<NewFolderPopup />
	{/if}
	<div class="container">
		<MetadataPanel />
		<div id="samples">
			<InstanceView />
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
