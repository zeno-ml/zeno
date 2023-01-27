<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selectionIds } from "../../stores";
</script>

<div class="id-chip">
	<span>Scatter Selection</span>
	<TrailingIcon
		class="remove material-icons"
		on:click={() => selectionIds.set({ ids: [] })}>
		cancel
	</TrailingIcon>
</div>

<style>
	.id-chip {
		--opacity: 0.25;
		padding: 5px;
		background: rgb(87, 0, 111, var(--opacity));
		background: linear-gradient(
			141deg,
			rgba(87, 0, 111, var(--opacity)) 0%,
			rgba(199, 15, 136, var(--opacity)) 43%,
			rgba(0, 189, 255, var(--opacity)) 100%
		);
		border: 1px solid #e8e8e8;
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
