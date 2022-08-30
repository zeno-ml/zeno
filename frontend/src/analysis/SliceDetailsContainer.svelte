<script lang="ts">
	import SliceDetails from "../general/SliceDetails.svelte";

	import { metadataSelections, sliceSelections } from "../stores";
	import { updateTab } from "../util/util";

	export let sli: Slice;

	let showTooltip = false;
</script>

<div
	class="slice-link"
	on:click={() => {
		updateTab("exploration");
		metadataSelections.set(new Map());
		sliceSelections.set([sli.sliceName]);
	}}
	on:mouseover={() => (showTooltip = true)}
	on:mouseout={() => (showTooltip = false)}
	on:focus={() => (showTooltip = true)}
	on:blur={() => (showTooltip = false)}>
	{sli.sliceName}
</div>

{#if showTooltip}
	<div class="tooltip-container">
		<div class="tooltip">
			<SliceDetails predicateGroup={sli.filterPredicates} />
		</div>
	</div>
{/if}

<style>
	.tooltip-container {
		z-index: 10;
		position: absolute;
		height: max-content;
		transform: translateY(100%);
	}
	.tooltip {
		background: white;
		padding: 10px;
		box-shadow: 1px 1px 3px 1px #ccc;
		border-radius: 3px;
	}

	.slice-link {
		color: #9b51e0;
		cursor: pointer;
	}
</style>
