<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import Checkbox from "@smui/checkbox";
	import FormField from "@smui/form-field";
	import {
		folders,
		folderToEdit,
		showNewFolder,
		slices,
		status,
		model,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { ZenoService } from "../../zenoservice";
	import Svelecte from "svelecte";
	import { getHistograms } from "../../api/metadata";

	let folderName = "";
	let input;
	let originalFolderName = "";

	let searchColumns = [];
	let selectColumns = [];

	$: metadataHistogram = getHistograms($status.completeColumns, $model);

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

{#await metadataHistogram then res}
	{@const searchColumnOptions = [...res]
		.filter(([k, v]) => k && v.length > 0)
		.map((e) => e[0].name)}
	<div
		id="paper-container"
		use:clickOutside
		on:click_outside={() => showNewFolder.set(false)}>
		<Paper elevation={7}>
			<Content>
				<Textfield
					bind:value={folderName}
					label="Folder Name"
					bind:this={input} />
				<div style="display: flex; align-items:center;">
					<h4 style="margin-right: 10px">Metadata Columns:</h4>
					<Svelecte
						style="width: 500px"
						bind:value={searchColumns}
						valueField="label"
						options={searchColumnOptions}
						multiple={true} />
				</div>
				<div id="buckets">
					{#each searchColumns as col}
						<FormField>
							<Checkbox bind:group={selectColumns} value={col} />
							<span slot="label">{col}</span>
						</FormField>
					{/each}
				</div>
				<div id="submit">
					<Button
						style="margin-left: 5px;"
						variant="outlined"
						disabled={invalidName}
						on:click={() => createFolder()}>
						{$folderToEdit ? "Update" : "Create"}
					</Button>
					<Button
						style="margin-left: 10px;"
						variant="outlined"
						on:click={() => showNewFolder.set(false)}>
						Cancel
					</Button>
				</div>
			</Content>
			{#if invalidName && folderName.length > 0}
				<p style:margin-right="10px" style:color="red">folder already exists</p>
			{/if}
		</Paper>
	</div>
{/await}

<style>
	#paper-container {
		position: fixed;
		left: 440px;
		top: 70px;
		z-index: 20;
	}
	#submit {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
	}
	#buckets {
		display: flex;
		flex-direction: column;
	}
</style>
