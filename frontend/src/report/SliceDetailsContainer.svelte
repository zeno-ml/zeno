<script lang="ts">
	import SliceDetails from "../general/SliceDetails.svelte";
	import { selections } from "../stores";
	import { updateTab } from "../util/util";
	import type { Slice } from "../zenoservice";

	export let sli: Slice;

	let showTooltip = false;
</script>

<div
	class="slice-link"
	on:click={() => {
		updateTab("exploration");
		selections.update((sel) => ({
			slices: [sli.sliceName],
			metadata: sel.metadata,
			tags: sel.tags,
		}));
	}}
	on:mouseover={() => (showTooltip = true)}
	on:mouseout={() => (showTooltip = false)}
	on:focus={() => (showTooltip = true)}
	on:blur={() => (showTooltip = false)}
	on:keydown={() => ({})}>
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
		background: var(--G6);
		padding: 10px;
		box-shadow: 1px 1px 3px 1px var(--G4);
		border-radius: 4px;
	}
	.slice-link {
		color: #6a1b9a;
		cursor: pointer;
	}
</style>
