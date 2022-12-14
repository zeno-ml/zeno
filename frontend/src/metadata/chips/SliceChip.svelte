<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selections } from "../../stores";

	export let slice;
</script>

<div class="meta-chip">
	{slice}
	<TrailingIcon
		class="remove material-icons"
		on:click={() =>
			selections.update((sel) => {
				sel.slices.splice(sel.slices.indexOf(slice), 1);
				return { slices: sel.slices, metadata: sel.metadata };
			})}>
		cancel
	</TrailingIcon>
</div>

<style>
	.meta-chip {
		padding: 5px;
		background: #f8f8f8;
		border: 1px solid #e8e8e8;
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
