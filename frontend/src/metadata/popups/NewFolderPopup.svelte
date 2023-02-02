<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import { folders, slices } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";

	export let edit = false;
	export let showNewFolder;
	export let folderName = "";

	let input;
	let originalFolderName = folderName;

	$: invalidName =
		($folders.includes(folderName) && folderName !== originalFolderName) ||
		folderName.length === 0;

	$: if (showNewFolder && input) {
		input.getElement().focus();
	}

	function createFolder() {
		if (edit) {
			folders.update((f) => {
				f.splice(f.indexOf(originalFolderName), 1);
				f.push(folderName);
				slices.update((slis) => {
					[...slis.keys()].forEach((sliKey) => {
						let s = slis.get(sliKey);
						if (s.folder === originalFolderName) {
							s.folder = folderName;
							slis.set(sliKey, s);
						}
					});
					return slis;
				});
				return f;
			});
		} else {
			folders.update((f) => {
				f.push(folderName);
				folderName = "";
				return [...f];
			});
		}
		showNewFolder = false;
	}

	function submit(e) {
		if (showNewFolder && e.key === "Escape") {
			showNewFolder = false;
		}
		if (showNewFolder && e.key === "Enter") {
			createFolder();
		}
	}
</script>

<svelte:window on:keydown={submit} />

<div
	id="paper-container"
	use:clickOutside
	on:click_outside={() => (showNewFolder = false)}>
	<Paper elevation={7}>
		<Content style="display: flex; align-items: center;">
			<Textfield
				bind:value={folderName}
				label="Folder Name"
				bind:this={input} />
			<Button
				style="margin-left: 10px;"
				variant="outlined"
				on:click={() => (showNewFolder = false)}>Cancel</Button>
			<Button
				style="margin-left: 5px;"
				variant="outlined"
				disabled={invalidName}
				on:click={() => createFolder()}>{edit ? "Update" : "Create"}</Button>
		</Content>
		{#if invalidName && folderName.length > 0}
			<p style:margin-right="10px">
				folder already exists
			</p>
		{/if}
	</Paper>
</div>

<style>
	#paper-container {
		position: fixed;
		left: 60px;
		top: 10px;
		z-index: 10;
	}
</style>
