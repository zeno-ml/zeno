<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import { folders, folderToEdit, showNewFolder, slices } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { ZenoService } from "../../zenoservice";

	let folderName = "";
	let input;
	let originalFolderName = "";

	$: invalidName =
		($folders.includes(folderName) && folderName !== originalFolderName) ||
		folderName.length === 0;

	$: if ($showNewFolder && input) {
		input.getElement().focus();
	}

	$: if ($folderToEdit) {
		originalFolderName = $folderToEdit;
		folderName = $folderToEdit;
	}

	/** Create a folder using the folderName variable **/
	function createFolder() {
		if ($folderToEdit) {
			slices.update((sls) => {
				let inFolder = [...sls.values()].filter(
					(d) => d.folder === originalFolderName
				);
				inFolder.forEach((slice) => {
					slice.folder = folderName;
					sls.set(slice.sliceName, slice);
					ZenoService.createNewSlice({
						sliceName: slice.sliceName,
						filterPredicates: slice.filterPredicates,
						folder: slice.folder,
					});
				});
				return sls;
			});
			folders.update((f) => {
				f[f.indexOf(originalFolderName)] = folderName;
				return f;
			});
			folderToEdit.set(undefined);
		} else {
			folders.update((f) => {
				f.push(folderName);
				return [...f];
			});
		}
		showNewFolder.set(false);
	}

	/** Define keyboard action **/
	function submit(e) {
		if ($showNewFolder && e.key === "Escape") {
			showNewFolder.set(false);
		}
		if ($showNewFolder && e.key === "Enter" && !invalidName) {
			createFolder();
		}
	}
</script>

<svelte:window on:keydown={submit} />

<div
	id="paper-container"
	use:clickOutside
	on:click_outside={() => showNewFolder.set(false)}>
	<Paper elevation={7}>
		<Content style="display: flex; align-items: center;">
			<Textfield
				bind:value={folderName}
				label="Folder Name"
				bind:this={input} />
			<Button
				style="margin-left: 10px;"
				variant="outlined"
				on:click={() => showNewFolder.set(false)}>
				Cancel
			</Button>
			<Button
				style="margin-left: 5px;"
				variant="outlined"
				disabled={invalidName}
				on:click={() => createFolder()}>
				{$folderToEdit ? "Update" : "Create"}
			</Button>
		</Content>
		{#if invalidName && folderName.length > 0}
			<p style:margin-right="10px" style:color="red">folder already exists</p>
		{/if}
	</Paper>
</div>

<style>
	#paper-container {
		position: fixed;
		left: 440px;
		top: 70px;
		z-index: 20;
	}
</style>
