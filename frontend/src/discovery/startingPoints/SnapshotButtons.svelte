<script lang="ts">
	import SnapshotButton from "./SnapshotButton.svelte";
	import type { Snapshot } from "./snapshot";

	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher<{ click: Snapshot }>();

	export let snapshots: Snapshot[];
	export let startingPoint: Snapshot;
</script>

{#each snapshots as snapshot}
	{@const isCurStartingPoint = snapshot.name === startingPoint.name}
	<SnapshotButton
		{snapshot}
		isSelected={isCurStartingPoint}
		on:click={() => {
			dispatch("click", snapshot);
		}}>
		{#if isCurStartingPoint}
			<slot />
		{/if}
	</SnapshotButton>
{:else}
	EMPTY
{/each}
