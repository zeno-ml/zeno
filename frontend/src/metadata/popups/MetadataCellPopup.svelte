<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import type { HistogramEntry } from "../../api/metadata";
	import { folders, showMetadataSlices } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { type ZenoColumn } from "../../zenoservice";
	import { createSlices } from "../cells/MetadataCellUtil";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];

	const MetadataPanel = document.getElementById("side-container");

	let folderName = col.name + "s";
	let input;
	let originalFolderName = "";

	$: invalidName =
		($folders.includes(folderName) && folderName !== originalFolderName) ||
		folderName.length === 0;

	$: if ($showMetadataSlices && input) {
		input.getElement().focus();
	}

	function createFolder() {
		createSlices(col, histogram, folderName);
		showMetadataSlices.set(false);
		MetadataPanel.scrollTop = 0;
	}

	/** Define keyboard action **/
	function submit(e) {
		if ($showMetadataSlices && e.key === "Escape") {
			showMetadataSlices.set(false);
		}
		if ($showMetadataSlices && e.key === "Enter" && !invalidName) {
			createFolder();
		}
	}
</script>

<svelte:window on:keydown={submit} />

{#if histogram}
	<div
		id="paper-container"
		use:clickOutside
		on:click_outside={() => showMetadataSlices.set(false)}>
		<Paper elevation={7}>
			<Content>
				<Textfield
					bind:value={folderName}
					label="Folder Name"
					bind:this={input} />
				<div id="buckets">
					<div style="display: flex; flex-wrap: wrap;padding: 10px">
						{#each histogram as h}
							<div class="slice-cell">
								<span>label == cat</span>
								<span class="metric">
									<span>85.76</span>
									<span class="size">(1000)</span>
								</span>
							</div>
						{/each}
					</div>
				</div>
				<div id="submit">
					<Button
						style="margin-left: 5px;"
						variant="outlined"
						disabled={invalidName}
						on:click={() => createFolder}>
						Create
					</Button>
					<Button
						style="margin-left: 10px;"
						variant="outlined"
						on:click={() => showMetadataSlices.set(false)}>
						Cancel
					</Button>
					{#if invalidName && folderName.length > 0}
						<p class="message">folder already exists</p>
					{/if}
				</div>
			</Content>
		</Paper>
	</div>
{/if}

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
	.message {
		margin: 0px 20px;
		color: red;
	}
</style>
