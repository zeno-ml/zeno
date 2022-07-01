<script lang="ts">
	import { filteredTable, ready } from "./stores";

	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import SampleOptions from "./samples/SampleOptions.svelte";
	import Samples from "./samples/Samples.svelte";
</script>

<div id="container">
	<MetadataPanel />

	<div style:margin-left="10px">
		<div id="sample-options">
			<SampleOptions />
		</div>
		{#if $ready}
			<div id="samples">
				<Samples table={$filteredTable} />
			</div>
		{/if}
	</div>
</div>

<style>
	#samples {
		margin-top: 10px;
		width: 100%;
		margin-right: 20px;
	}
	#sample-options {
		margin-top: 10px;
		width: 100%;
		min-height: 35px;
		margin-right: 20px;
	}
	#container {
		display: flex;
		flex-direction: row;
	}
</style>
