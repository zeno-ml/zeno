<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import Checkbox from "@smui/checkbox";
	import { InternMap } from "internmap";
	import {
		folders,
		folderToEdit,
		showNewFolder,
		slices,
		status,
		model,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { columnHash } from "../../util/util";
	import { ZenoService, type ZenoColumn } from "../../zenoservice";
	import Svelecte from "svelecte";
	import { getHistograms, type HistogramEntry } from "../../api/metadata";

	let folderName = "";
	let input;
	let originalFolderName = "";

	let searchColumns: ZenoColumn[] = [];
	let searchOptions: ZenoColumn[] = [];
	let selectColumns = [];

	let metadataHistograms: InternMap<ZenoColumn, HistogramEntry[]> =
		new InternMap([], columnHash);

	showNewFolder.subscribe((s) => {
		if (s) {
			getHistograms($status.completeColumns, $model).then((res) => {
				metadataHistograms = res;
				searchOptions = [...metadataHistograms]
					.filter(([k, v]) => k && v.length > 0)
					.map((e) => e[0]);
			});
		}
	});

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
					valueField={"name"}
					labelField={"name"}
					valueAsObject={true}
					options={searchOptions}
					multiple={true} />
			</div>
			<div id="buckets">
				{#each searchColumns as col}
					<div style="display: flex; align-items: center">
						<Checkbox bind:group={selectColumns} value={col.name} />
						<span>{col.name}</span>
					</div>
					<div style="display: flex; flex-wrap: wrap;padding: 10px">
						{#each metadataHistograms.get(col) as h}
							<div class="slice-cell">
								<span>label == cat</span>
								<span class="metric">
									<span>85.76</span>
									<span class="size">(1000)</span>
								</span>
							</div>
						{/each}
					</div>
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
		width: 720px;
		height: 50vh;
		max-height: 50vh;
		flex-direction: column;
		overflow: auto;
		margin-bottom: 20px;
		border-bottom: 1px solid var(--G3);
	}
	.slice-cell {
		display: flex;
		justify-content: space-around;
		align-items: center;
		text-transform: none;
		width: 200px;
		margin: 5px;
		padding: 5px;
		border: 1px solid var(--G4);
		border-radius: 5px;
		cursor: pointer;
	}
	.metric {
		font-size: 12px;
		color: black;
	}
	.size {
		font-style: italic;
		color: var(--G3);
	}
	.slice-cell:hover {
		background-color: var(--P3);
	}
</style>
