<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import type { HistogramEntry } from "../../api/metadata";
	import { folders, showMetadataSlices, slices } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { type ZenoColumn } from "../../zenoservice";
	import { bucketName, createSlices } from "../cells/MetadataCellUtil";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];

	const MetadataPanel = document.getElementById("side-container");

	let folderName = col.name + "s";
	let input;
	let originalFolderName = "";

	let sliceNames: string[] = [];
	let selectedSlices: boolean[] = [];

	histogram.forEach((h) => {
		sliceNames.push(bucketName(col, h));
		selectedSlices.push(true);
	});

	$: invalidSliceName =
		sliceNames.filter(
			(s, i) => selectedSlices[i] && ($slices.has(s) || s.length === 0)
		).length > 0;

	$: invalidFolderName =
		($folders.includes(folderName) && folderName !== originalFolderName) ||
		folderName.length === 0;

	$: if ($showMetadataSlices && input) {
		input.getElement().focus();
	}

	/** Create metadata slices folder **/
	function createFolder() {
		createSlices(col, histogram, folderName, sliceNames, selectedSlices);
		showMetadataSlices.set(false);
		MetadataPanel.scrollTop = 0;
	}

	/** Define keyboard action **/
	function submit(e) {
		if ($showMetadataSlices && e.key === "Escape") {
			showMetadataSlices.set(false);
		}
		if (
			$showMetadataSlices &&
			e.key === "Enter" &&
			!invalidFolderName &&
			!invalidSliceName
		) {
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
					<div style="display: flex; flex-wrap: wrap; padding: 10px">
						{#each histogram as h, i}
							<div style="display: flex; flex-direction: column">
								<div
									class="slice-cell {selectedSlices[i] ? 'selected' : ''}"
									on:keydown={() => ({})}
									on:click={() => (selectedSlices[i] = !selectedSlices[i])}>
									<Textfield
										style="height: 30px; margin-right: 10px;"
										on:click={(e) => e.stopPropagation()}
										bind:value={sliceNames[i]} />
									<span class="metric">
										<span>{h.metric.toFixed(2)}</span>
										<span class="size">
											({h.filteredCount ? h.filteredCount.toLocaleString() : 0})
										</span>
									</span>
								</div>
								{#if selectedSlices[i]}
									{#if $slices.has(sliceNames[i])}
										<p class="message">slice already exists</p>
									{:else if sliceNames[i].length === 0}
										<p class="message">slice name can't be empty</p>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>
				<div id="submit">
					<Button
						style="margin-left: 5px;"
						variant="outlined"
						disabled={invalidFolderName || invalidSliceName}
						on:click={createFolder}>
						Create
					</Button>
					<Button
						style="margin-left: 10px;"
						variant="outlined"
						on:click={() => showMetadataSlices.set(false)}>
						Cancel
					</Button>
					{#if invalidFolderName}
						{#if folderName.length > 0}
							<p class="message">folder already exists</p>
						{:else}
							<p class="message">folder name can't be empty</p>
						{/if}
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
		width: calc(50vw);
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
		margin: 5px;
		padding: 5px;
		border: 1px solid var(--G4);
		border-radius: 5px;
		cursor: pointer;
	}
	.metric {
		font-size: 13px;
		color: black;
	}
	.size {
		font-style: italic;
		color: var(--G3);
	}
	.selected {
		background-color: var(--P3);
	}
	.message {
		margin: 0px 20px;
		color: red;
	}
</style>
