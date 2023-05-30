<script lang="ts">
	import SliceDetails from "../../general/SliceDetails.svelte";
	import { selections } from "../../stores";
	import { updateTab } from "../../util/util";
	import type { Slice } from "../../zenoservice";

	export let sli: Slice;

	let showTooltip = false;
</script>

<div
	class="slice-link"
	on:click={() => {
		updateTab("explore");
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
		width: fit-content;
		position: absolute;
		transform: translateY(10%);
	}
	.tooltip {
		background: var(--G6);
		padding-left: 10px;
		padding-right: 10px;
		box-shadow: 1px 1px 3px 1px var(--G3);
		border-radius: 4px;
		padding-top: 10px;
		padding-bottom: 10px;
	}
	.slice-link {
		color: #6a1b9a;
		cursor: pointer;
	}
</style>
