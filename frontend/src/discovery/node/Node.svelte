<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconButton from "@smui/icon-button";

	export let node: Pipeline.Node;
	export let selectedId: string = "";
	export let lastNode: boolean = false;
	export let maxCount = 10_000;

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
				size="mini"
				class="material-icons"
				on:click={() => {
					dispatch("reset");
				}}>{icon.back}</IconButton>
		{/if}
	</div>

	<div
		on:click
		style="position:relative;"
		class="chip node"
		class:off={!selectedNode}
		on:mouseenter
		on:mouseleave
		on:click={() => {
			dispatch("select");
		}}
		style:cursor="pointer">
		<div id="node-text">
			{node.type}
		</div>
		<div
			id="bar"
			style:width="{(node.state.projection.length / maxCount) * 100}%"
			style:height="3px"
			style:background-color="#00000020"
			style="left: 0; bottom: 0;" />
	</div>
	<div class="count">
		({node.state.projection.length})
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
		--h-primary: 278;
		--s-primary: 70%;
		--l-primary: 35%;
		--a-primary: 1;

		--h-secondary: 0;
		--s-secondary: 0%;
		--l-secondary: 30%;
		--a-secondary: 1;
	}
	.chip {
		/* padding: 5px; */
		color: hsla(
			var(--h-primary),
			var(--s-primary),
			var(--l-primary),
			var(--a-primary)
		);
		background-color: hsla(
			var(--h-primary),
			var(--s-primary),
			var(--l-primary),
			0.1
		);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		text-align: center;
		text-transform: uppercase;
		width: fit-content;
	}
	.chip.off {
		color: hsla(
			var(--h-secondary),
			var(--s-secondary),
			var(--l-secondary),
			var(--a-secondary)
		);
		background-color: hsla(
			var(--h-secondary),
			var(--s-secondary),
			var(--l-secondary),
			0.1
		);
	}
	.reset {
		width: 50px;
	}
	.node {
		width: 20ch;
	}
	#node-text {
		padding-top: 5px;
		padding-bottom: 5px;
	}
	.count {
		width: 10ch;
		text-align: center;
		color: hsla(
			var(--h-secondary),
			var(--s-secondary),
			var(--l-secondary),
			0.2
		);
	}
</style>
