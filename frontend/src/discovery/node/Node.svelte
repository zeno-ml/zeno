<script lang="ts">
	export let node: Pipeline.Node;
</script>

<div on:click class="chip" on:mouseenter on:mouseleave>{node.type}</div>

<style>
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
