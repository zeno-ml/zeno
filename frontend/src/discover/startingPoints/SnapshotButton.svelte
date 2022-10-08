<script lang="ts">
	import type { Snapshot } from "./snapshot";

	export let snapshot: Snapshot;
	export let isSelected = false;
</script>

<div id="total-container">
	<div
		class="starting-container"
		class:starting-open={isSelected}
		class:starting-selected={isSelected}
		on:click>
		<div class="starting-label" style={!isSelected ? "overflow: hidden;" : ""}>
			{snapshot?.name}
		</div>
		<div class="no-interact">
			<slot />
		</div>
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
		height: 22px;
		cursor: pointer;
		background-color: rgba(0, 0, 0, 0.025);
		border-radius: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		transition: height 1s ease-in-out, transform 200ms ease-in-out,
			box-shadow 200ms ease-in-out;
		overflow: hidden;
	}
	.starting-container:hover {
		/* background-color: #71319a10; */
		box-shadow: 0 0 3px 3px #71319a20;
		transform: scale(1.025);
	}
	.starting-open {
		height: 150px;
	}
	.starting-selected {
		box-shadow: 0 0 3px 3px #71319a20;
		color: #71319a;
		transform: scale(1.025);
	}
</style>
