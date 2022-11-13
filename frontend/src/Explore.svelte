<script lang="ts">
	import {
		metadataSelections,
		status,
		zenoState,
		filteredTable,
		ready,
	} from "./stores";
	import { getFilteredTable, getHistograms } from "./api";

	import MetadataPanel from "./metadata/MetadataPanel.svelte";
	import Samples from "./general/Samples.svelte";
	import OptionsBar from "./general/OptionsBar.svelte";

	let metadataHistograms = {};

	zenoState.subscribe((state) => {
		metadataSelections.update((m) => {
			Object.keys(m).forEach((k) => {
				m[k] = { predicates: [], join: "" };
			});
			return m;
		});
		getHistograms(
			$status.completeColumns,
			Object.values($metadataSelections).filter((m) => m.predicates.length > 0),
			state
		).then((res) => (metadataHistograms = res));
	});

	metadataSelections.subscribe((mets) => {
		if ($status.completeColumns.length === 0) {
			return;
		}
		getHistograms(
			$status.completeColumns,
			Object.values(mets).filter((m) => m.predicates.length > 0),
			$zenoState
		).then((res) => (metadataHistograms = res));
	});
</script>

{#if $ready && $status.completeColumns.length > 0}
	<OptionsBar />
	<div id="container">
		<MetadataPanel {metadataHistograms} />

		<div id="samples" style:width="100%" style:padding-left="10px">
			<Samples table={$filteredTable} />
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
