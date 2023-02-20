<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
  	import type { Tag } from "src/zenoservice";
	import { createNewTag } from "../../api/tag";
	import { tags, selectionIds } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";

	export let edit = false;
	export let showNewTag;
	export let tagName = "";
    export let scrollY;

	let input;
	let folder = "";
	let originalTagName = tagName;

	$: invalidName =
		([...($tags.keys())].includes(tagName) && tagName !== originalTagName) ||
		tagName.length === 0;

	$: if (showNewTag && input) {
		input.getElement().focus();
	}

	function createTag() {
		if (edit) { // editing tag name
			// tags.update((t) => {
			// 	t.splice(t.indexOf(originalTagName), 1);
			// 	t.push(tagName);
			// 	return t;
			// });
			// updating not supported yet
		} else {
			createNewTag(tagName, $selectionIds.ids).then(() => {
				tags.update((t) => {
					t.set(tagName, <Tag>{
						tagName,
						folder,
						selectionIds: $selectionIds.ids
					});
					return t;
				});
			});
		}
		showNewTag = false;
	}

	function submit(e) {
		if (showNewTag && e.key === "Escape") {
			showNewTag = false;
		}
		if (showNewTag && e.key === "Enter") {
			createTag();
		}
	}
</script>

<svelte:window on:keydown={submit}/>

<div
	id="paper-container"
    style="top: {210 - scrollY}px"
	use:clickOutside
	on:click_outside={() => (showNewTag = false)}>
	<Paper elevation={7}>
		<Content style="display: flex; align-items: center;">
			<Textfield
				bind:value={tagName}
				label="Tag Name"
				bind:this={input} />
			<Button
				style="margin-left: 10px;"
				variant="outlined"
				on:click={() => (showNewTag = false)}>Cancel</Button>
			<Button
				style="margin-left: 5px;"
				variant="outlined"
				disabled={invalidName}
				on:click={() => createTag()}>{edit ? "Update" : "Create"}</Button>
		</Content>
		{#if invalidName && tagName.length > 0}
			<p style:margin-right="10px">tag already exists</p>
		{:else if $selectionIds.ids.length > 0}
			<p style:margin-right="10px">There are {$selectionIds.ids.length} instances in your tag.</p>
		{/if}
	</Paper>
</div>

<style>
	#paper-container {
		position: fixed;
		left: 60px;
		z-index: 10;
	}
</style>
