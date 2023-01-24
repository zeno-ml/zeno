<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selectionIds } from "../../stores";
</script>

<div class="id-chip">
	<span>User Selected Data</span>
	<TrailingIcon
		class="remove material-icons"
		on:click={() => selectionIds.set({ ids: [] })}>
		cancel
	</TrailingIcon>
</div>

<style>
	.id-chip {
		padding: 5px;
		background: #6a1b9a10;
		border: 1px solid #6a1b9a;
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
