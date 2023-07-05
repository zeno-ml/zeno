<script lang="ts">
	import Paper from "@smui/paper";
	import { createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";

	const dispatch = createEventDispatcher();

	let paperHeight;
</script>

<div
	class="paper-container"
	transition:fade={{ duration: 200 }}
	bind:clientHeight={paperHeight}
	on:mousedown={() => dispatch("close")}
	on:keydown={() => undefined}>
	<Paper elevation={7} on:mousedown={(e) => e.stopPropagation()}>
		<slot />
	</Paper>
</div>

<style>
	.paper-container {
		position: absolute;
		left: 0px;
		right: 0px;
		top: 0px;
		bottom: 0px;
		z-index: 20;
		display: flex;
		justify-content: center;
		align-items: baseline;
		padding: 50px;
		background-color: color-mix(in srgb, var(--G1), transparent 66%);
	}
</style>
