<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";

	import { folders } from "../../stores";
	import { clickOutside } from "../../clickOutside";

	let folderName = "";
	let showNewFolder = false;
</script>

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
					<Textfield bind:value={folderName} label="Folder Name" />
					<Button
						style="margin-left: 20px;"
						variant="outlined"
						on:click={() => {
							folders.update((f) => {
								f.push(folderName);
								folderName = "";
								return [...f];
							});
							showNewFolder = false;
						}}>Create</Button>
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
