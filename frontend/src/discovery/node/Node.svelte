<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconButton from "@smui/icon-button";
	export let node: Pipeline.Node;
	export let selectedId: string = "";
	export let lastNode: boolean = false;
	const dispatch = createEventDispatcher();

	const icon = {
		eye: {
			on: "visibility",
			off: "visibility_off",
		},
		back: "undo",
	};
	$: selectedNode = selectedId === node.id;
</script>

<div class="node-container">
	<div>
		<IconButton class="material-icons" on:click={() => dispatch("eyeClick")}>
			{selectedNode ? icon.eye.on : icon.eye.off}
		</IconButton>
	</div>
	<div on:click class="chip" on:mouseenter on:mouseleave>{node.type}</div>
	{#if !lastNode}
		<div>
			<IconButton
				class="material-icons"
				on:click={() => {
					dispatch("backClick");
				}}>{icon.back}</IconButton>
		</div>
	{/if}
</div>

<style>
	.node-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		height: 100%;
		position: relative;
		cursor: pointer;
	}
	.chip {
		padding: 5px;
		background: rgba(0, 0, 0, 0.07);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
