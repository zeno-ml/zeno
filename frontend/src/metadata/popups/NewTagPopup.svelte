<script lang="ts">
	import Button from "@smui/button";
	import { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import { createNewTag } from "../../api/tag";
	import { selectionIds, showNewTag, tags } from "../../stores";
	import type { Tag } from "../../zenoservice";

	let tagName = "";
	let folder = "";
	let input;
	let originalTagName = tagName;

	$: invalidName =
		([...$tags.keys()].includes(tagName) && tagName !== originalTagName) ||
		tagName.length === 0;

	$: if ($showNewTag && input) {
		input.getElement().focus();
	}

	function createTag() {
		if (tagName.length === 0) {
			tagName = "Tag " + $tags.size;
		}

		createNewTag(tagName, $selectionIds).then(() => {
			tags.update((t) => {
				t.set(tagName, <Tag>{
					tagName,
					folder,
					selectionIds: { ids: [...$selectionIds.ids] },
				});
				return t;
			});
			showNewTag.set(false);
		});
	}

	function submit(e) {
		if ($showNewTag && e.key === "Escape") {
			showNewTag.set(false);
		}
		if ($showNewTag && e.key === "Enter") {
			createTag();
		}
	}
</script>

<svelte:window on:keydown={submit} />

<Content style="display: flex; align-items: center;">
	<Textfield bind:value={tagName} label="Tag Name" bind:this={input} />
	<Button
		style="margin-left: 10px;"
		variant="outlined"
		on:click={() => showNewTag.set(false)}>Cancel</Button>
	<Button
		style="margin-left: 5px;"
		variant="outlined"
		disabled={invalidName}
		on:click={() => createTag()}>{"Create"}</Button>
</Content>
{#if invalidName && tagName.length > 0}
	<p style:margin-right="10px">tag already exists</p>
{:else if $selectionIds.ids.length > 0}
	<p style:margin-right="10px">
		{$selectionIds.ids.length} instances selected
	</p>
{/if}
