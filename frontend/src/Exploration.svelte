<script lang="ts">
	import { filteredTable, ready, table } from "./stores";

	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import SampleOptions from "./samples/SampleOptions.svelte";
	import Samples from "./samples/Samples.svelte";
</script>

{#if $ready && $table.size > 0}
	<div id="container">
		<MetadataPanel />

		<div style:width="100%" style:padding-left="10px">
			<div id="sample-options">
				<SampleOptions />
			</div>
			<div id="samples">
				<Samples table={$filteredTable} />
			</div>
		</div>
	</div>
{/if}

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
		min-width: 100%;
	}
</style>
