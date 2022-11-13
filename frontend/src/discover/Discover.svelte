<script lang="ts">
	/**
	 * Discovery.svelte (V2)
	 * The first part of Zeno dedicated to finding blindspots from the data
	 * representations. This is the top-level parent component for all things discovery
	 */

	import MetadataPanel from "../metadata/MetadataPanel.svelte";
	import OptionsBar from "../general/OptionsBar.svelte";
	import EmbedView from "./EmbedView.svelte";
	import {
		filteredTable,
		colorSpec,
		colorByHash,
		availableColors,
	} from "../stores";
	import Samples from "../general/Samples.svelte";

	$: {
		const colorDefined = $colorByHash in $availableColors;
		if (!colorDefined) {
			chooseAvailableColor();
		}
	}

	function chooseAvailableColor() {
		const colorColumns = Object.keys($availableColors);
		if (colorColumns.length > 0) {
			const last = colorColumns.length - 1;
			colorByHash.set(colorColumns[last]);
		}
	}
</script>

<OptionsBar />
<main>
	<div id="sidebar-view">
		<MetadataPanel shouldColor />
	</div>

	<div id="main-view">
		<div id="embed-view">
			{#if $colorSpec}
				<EmbedView />
			{/if}
		</div>
		<div id="samples-view">
			<Samples table={$filteredTable} />
		</div>
	</div>
</main>

<style>
	main {
		display: flex;
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none;
	}
</style>
