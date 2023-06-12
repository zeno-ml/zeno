<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selections, tagIds, tags } from "../../stores";
	export let tag;
</script>

<div class="meta-chip">
	{tag}
	<TrailingIcon
		class="remove material-icons"
		on:click={() => {
			selections.update((sel) => {
				sel.tags.splice(sel.tags.indexOf(tag), 1);
				return { slices: sel.slices, metadata: sel.metadata, tags: sel.tags };
			});

			let s = new Set();
			//this is to catch for the case when you have intersections between tags
			//must come after selections is updated
			$selections.tags.forEach((tag) =>
				$tags.get(tag).selectionIds.ids.forEach((id) => s.add(id))
			);
			let finalArray = [];
			s.forEach((id) => finalArray.push(id));
			tagIds.set({ ids: finalArray });
		}}>
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
		border-radius: 15px;
		width: fit-content;
	}
</style>
