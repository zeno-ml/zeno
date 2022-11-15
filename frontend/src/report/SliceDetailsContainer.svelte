<script lang="ts">
	import { selections } from "../stores";
	import SliceDetails from "../general/SliceDetails.svelte";
	import { updateTab } from "../util/util";

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
		background: white;
		padding: 10px;
		box-shadow: 1px 1px 3px 1px #ccc;
		border-radius: 3px;
	}

	.slice-link {
		color: #6a1b9a;
		cursor: pointer;
	}
</style>
