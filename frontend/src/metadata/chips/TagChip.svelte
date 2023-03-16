<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selections, tagIds, tags } from "../../stores";
	import removeTagIdsfromTagIds from "../cells/TagCell.svelte"
	export let tag;
</script>

<div class="meta-chip">
	{tag}
	<TrailingIcon
		class="remove material-icons"
		on:click={() =>
			{
				// updating tagIds when tag removed
				let s = new Set()
				$tagIds.ids.forEach(id => s.add(id))
				$tags.get(tag).selectionIds.ids.forEach(id => s.delete(id))
				let finalArray = []
				s.forEach(id => finalArray.push(id))
				tagIds.set({ids: finalArray})

				selections.update((sel) => {
					sel.tags.splice(sel.tags.indexOf(tag), 1);
					return { slices: sel.slices, metadata: sel.metadata, tags: sel.tags };
				});


			}
			}>
		cancel
	</TrailingIcon>
</div>

<style>
	.meta-chip {
		padding: 5px 10px;
		background: var(--N2);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 4px;
		width: fit-content;
	}
</style>
