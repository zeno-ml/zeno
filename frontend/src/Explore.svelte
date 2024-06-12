<script lang="ts">
	import InstanceView from "./instance-views/InstanceView.svelte";
	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import NewFolderPopup from "./metadata/popups/NewFolderPopup.svelte";
	import NewSlicePopup from "./metadata/popups/NewSlicePopup.svelte";
	import SliceFinderPopup from "./metadata/popups/SliceFinderPopup.svelte";
	import NewTagPopup from "./metadata/popups/NewTagPopup.svelte";
	import MetadataCellPopup from "./metadata/popups/MetadataCellPopup.svelte";
	import {
		metadataColumn,
		metadataHistogram,
		ready,
		showNewFolder,
		showNewSlice,
		showSliceFinder,
		showMetadataSlices,
		showNewTag,
		status,
	} from "./stores";
</script>

{#if $ready && $status.completeColumns.length > 0}
	<!-- These popups are at the top level b/c of issues with overflow-y scroll. -->
	{#if $showNewSlice}
		<NewSlicePopup />
	{/if}
	{#if $showNewFolder}
		<NewFolderPopup />
	{/if}
	{#if $showSliceFinder}
		<SliceFinderPopup />
	{/if}
	{#if $showMetadataSlices}
		<MetadataCellPopup histogram={$metadataHistogram} col={$metadataColumn} />
	{/if}
	{#if $showNewTag}
		<NewTagPopup />
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
