<script lang="ts">
	import type { Snapshot } from "./snapshot";

	export let snapshot: Snapshot;
	export let isSelected = false;
</script>

<div
	class="starting-container"
	class:starting-open={isSelected}
	class:starting-selected={isSelected}
	on:click>
	<div class="starting-label">
		{snapshot?.name}
	</div>
	<div class="no-interact">
		<slot />
	</div>
</div>

<style>
	.no-interact {
		pointer-events: none;
		display: inline;
	}
	.starting-label {
		height: 100%;
	}
	.starting-container {
		position: relative;
		width: 250px;
		height: 30px;
		cursor: pointer;
		background-color: rgba(0, 0, 0, 0.025);
		border-radius: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		transition: height 1s ease-in-out;
		overflow: hidden;
	}
	.starting-container:hover {
		background-color: #71319a10;
	}
	.starting-open {
		height: 150px;
	}
	.starting-selected {
		border: #71319a 2px solid;
		color: #71319a;
	}
</style>
