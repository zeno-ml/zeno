<script lang="ts">
	import InstanceView from "./instance-views/InstanceView.svelte";
	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import NewFolderPopup from "./metadata/popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./metadata/popups/NewSlicePopup.svelte";
	import SliceFinderPopup from "./metadata/popups/SliceFinderPopup.svelte";
	import {
		ready,
		status,
		showSliceFinder,
		showNewSlice,
		showNewFolder,
	} from "./stores";
</script>

{#if $ready && $status.completeColumns.length > 0}
	{#if $showNewSlice}
		<NewSlicePopup />
	{/if}
	{#if $showNewFolder}
		<NewFolderPopup />
	{/if}
	{#if $showSliceFinder}
		<SliceFinderPopup />
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
