<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconButton from "@smui/icon-button";

	export let node: Pipeline.Node;
	export let selectedId = "";
	export let lastNode = false;

	const dispatch = createEventDispatcher();
	const icon = {
		eye: {
			on: "visibility",
			off: "visibility_off",
		},
		back: "replay",
	};

	$: selectedNode = selectedId === node.id;
</script>

<div class="node-container">
	<div class="reset">
		{#if !lastNode}
			<IconButton
				class="material-icons"
				on:click={() => {
					dispatch("backClick");
				}}>{icon.back}</IconButton>
		{/if}
	</div>
	<div class="view">
		<IconButton
			class="material-icons"
			on:click={() => dispatch("eyeClick")}
			disabled={selectedNode}>
			{selectedNode ? icon.eye.on : icon.eye.off}
		</IconButton>
	</div>
	<div on:click class="chip node" on:mouseenter on:mouseleave>{node.type}</div>
	<div class="count">
		({node.state.projection.length} points)
	</div>
</div>

<style>
	.node-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		height: 100%;
		position: relative;
		gap: 3px;
		--h: 271;
		--s: 69%;
		--l: 60%;
		--a: 1;
	}
	.chip {
		padding: 5px;
		color: hsla(var(--h), var(--s), var(--l), var(--a));
		background-color: hsla(var(--h), var(--s), var(--l), 0.1);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		text-align: center;
		text-transform: uppercase;
		width: fit-content;
	}
	.reset {
		width: 50px;
	}
	.view {
		width: 50px;
	}
	.node {
		width: 10ch;
	}
	.count {
		width: 12ch;
		text-align: left;
		color: hsla(var(--h), var(--s), var(--l), 0.4);
	}
</style>
