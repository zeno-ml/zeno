<script lang="ts">
	import {
		mdiChevronDown,
		mdiDotsHorizontal,
		mdiChevronUp,
		mdiPencilOutline,
	} from "@mdi/js";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import { slide } from "svelte/transition";
	import { folders, slices } from "../../stores";
	import NewFolderPopup from "../popups/NewFolderPopup.svelte";
	import SliceCell from "./SliceCell.svelte";
	import { createNewSlice } from "../../api";

	export let folder: string;

	let expandFolder = false;
	let dragOver = false;
	let showNewFolder = false;

	let hovering = false;
	let showOptions = false;

	$: sls = [...$slices.values()].filter((s) => s.folder === folder);
</script>

<div
	class="cell {dragOver ? 'hover' : ''} {expandFolder ? 'expanded' : ''}"
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}
	on:dragenter={() => (dragOver = true)}
	on:dragover={(ev) => ev.preventDefault()}
	on:dragleave={() => (dragOver = false)}
	on:drop={(ev) => {
		dragOver = false;
		const data = ev.dataTransfer.getData("text/plain");
		slices.update((sls) => {
			const sli = sls.get(data);
			sli.folder = folder;
			sls.set(data, sli);
			createNewSlice(sli.sliceName, sli.filterPredicates, folder);
			return sls;
		});
	}}>
	<div class="inline">
		<div
			style="width: 24px; height: 24px; cursor: pointer; margin-right: 10px;"
			on:keydown={() => ({})}
			on:click={() => (expandFolder = !expandFolder)}>
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={expandFolder ? mdiChevronDown : mdiChevronUp} />
			</Icon>
		</div>
		{folder}
	</div>
	<div class="inline">
		{#if showOptions}
			<div
				id="options-container"
				on:mouseleave={() => (showOptions = false)}
				on:blur={() => (showOptions = false)}>
				<IconButton
					on:click={(e) => {
						e.stopPropagation();
						showNewFolder = true;
					}}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiPencilOutline} />
					</Icon>
				</IconButton>
				<IconButton
					on:click={(e) => {
						e.stopPropagation();
						showOptions = false;
						slices.update((sls) => {
							let inFolder = [...sls.values()].filter(
								(d) => d.folder === folder
							);
							inFolder.forEach((slice) => {
								slice.folder = "";
								sls.set(slice.sliceName, slice);
							});
							return sls;
						});
						folders.update((folders) => {
							folders.splice(folders.indexOf(folder), 1);
							return folders;
						});
					}}>
					<Icon class="material-icons">delete_outline</Icon>
				</IconButton>
			</div>
		{/if}
		<div style:margin-right="10px">
			{sls.length} slice{sls.length === 1 ? "" : "s"}
		</div>
		<div class="inline" style:cursor="pointer">
			<div style:width="36px">
				{#if hovering}
					<IconButton
						size="button"
						style="padding: 0px"
						on:click={(e) => {
							e.stopPropagation();
							showOptions = !showOptions;
						}}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiDotsHorizontal} />
						</Icon>
					</IconButton>
				{/if}
			</div>
		</div>
	</div>
</div>
{#if expandFolder}
	<div transition:slide>
		{#each sls as s}
			<SliceCell slice={s} inFolder={true} />
		{/each}
	</div>
{/if}
{#if showNewFolder}
	<NewFolderPopup folderName={folder} edit={true} bind:showNewFolder />
{/if}

<style>
	.cell {
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border: 0.5px solid #ebebea;
		padding-left: 10px;
		padding-right: 10px;
		margin-top: 5px;
		border-radius: 5px;
		height: 36px;
		background: #f8f8f8;
	}
	#options-container {
		right: 0px;
		z-index: 5;
		background: white;
		margin-top: -7px;
		border: 1px solid #e8e8e8;
		position: absolute;
		height: max-content;
		display: flex;
	}
	.expanded {
		margin-bottom: 0px;
	}
	.hover {
		background: #f9f5ff;
	}
	.inline {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
</style>
