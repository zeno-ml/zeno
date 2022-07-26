<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";

	import { folders } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";

	let folderName = "";
	let showNewFolder = false;

	let input;

	function createFolder() {
		folders.update((f) => {
			f.push(folderName);
			folderName = "";
			return [...f];
		});
		showNewFolder = false;
	}

	function submit(e) {
		if (showNewFolder && e.key === "Enter") {
			createFolder();
		}
	}

	$: if (showNewFolder && input) {
		input.getElement().focus();
	}
</script>

<svelte:window on:keydown={submit} />

<div>
	<Button
		variant="outlined"
		style="margin-right: 10px"
		on:click={() => (showNewFolder = true)}>
		New Folder
	</Button>
	{#if showNewFolder}
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
						style="margin-left: 20px;"
						variant="outlined"
						on:click={() => createFolder()}>Create</Button>
				</Content>
			</Paper>
		</div>
	{/if}
</div>

<style>
	#paper-container {
		position: absolute;
		z-index: 1;
		margin-top: 10px;
	}
</style>
