<script lang="ts">
	import InstanceView from "./instance-views/InstanceView.svelte";
	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import NewSlicePopup from "./metadata/popups/NewSlicePopup.svelte";
	import Popup from "./metadata/popups/Popup.svelte";
	import SliceFinderPopup from "./metadata/popups/SliceFinderPopup.svelte";
	import { ready, showSliceFinder, status, showNewSlice } from "./stores";
</script>

{#if $ready && $status.completeColumns.length > 0}
	{#if $showNewSlice}
		<NewSlicePopup />
	{/if}
	{#if $showSliceFinder}
		<Popup on:close={() => showSliceFinder.set(false)}>
			<SliceFinderPopup />
		</Popup>
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
