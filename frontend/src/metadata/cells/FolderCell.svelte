<script lang="ts">
	import { mdiChevronDown, mdiDotsHorizontal, mdiChevronRight } from "@mdi/js";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import Paper, { Content } from "@smui/paper";
	import { slide } from "svelte/transition";
	import {
		folders,
		folderToEdit,
		showNewFolder,
		slices,
		tab,
	} from "../../stores";
	import SliceCell from "./SliceCell.svelte";
	import { ZenoService } from "../../zenoservice";
	import { clickOutside } from "../../util/clickOutside";

	export let folder: string;

	let expandFolder = false;
	let dragOver = false;

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
		const data = ev.dataTransfer.getData("text/plain").split(",");
		slices.update((sls) => {
			let entries = Array.from($slices.entries());
			data.forEach((d) => {
				const sli = sls.get(entries[d][0]);
				sli.folder = folder;
				sls.set(entries[d][0], sli);
				ZenoService.createNewSlice({
					sliceName: sli.sliceName,
					filterPredicates: sli.filterPredicates,
					folder: folder,
				});
			});
			return sls;
		});
	}}>
	<div class="inline">
		<div
			style="width: 24px; height: 24px; cursor: pointer; margin-right: 10px;"
			on:keydown={() => ({})}
			on:click={() => (expandFolder = !expandFolder)}>
			<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
				<path
					fill="black"
					d={expandFolder ? mdiChevronDown : mdiChevronRight} />
			</Icon>
		</div>
		{folder}
	</div>
	<div
		class="inline"
		use:clickOutside
		on:click_outside={() => (showOptions = false)}>
		{#if showOptions}
			<div id="options-container">
				<Paper style="padding: 3px 0px;" elevation={7}>
					<Content>
						<div
							class="option"
							on:keydown={() => ({})}
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								folderToEdit.set(folder);
								showNewFolder.set(true);
							}}>
							<Icon style="font-size: 18px;" class="material-icons">edit</Icon
							>&nbsp;
							<span>Edit</span>
						</div>
						<div
							class="option"
							on:keydown={() => ({})}
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
										ZenoService.createNewSlice({
											sliceName: slice.sliceName,
											filterPredicates: slice.filterPredicates,
											folder: slice.folder,
										});
									});
									return sls;
								});
								folders.update((folders) => {
									folders.splice(folders.indexOf(folder), 1);
									return folders;
								});
							}}>
							<Icon style="font-size: 18px;" class="material-icons"
								>delete_outline</Icon
							>&nbsp;
							<span>Remove</span>
						</div>
					</Content>
				</Paper>
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
			<SliceCell compare={$tab === "comparison"} slice={s} inFolder={true} />
		{/each}
	</div>
{/if}

<style>
	.cell {
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding-left: 10px;
		padding-right: 10px;
		margin-top: 5px;
		border-radius: 4px;
		height: 36px;
		background: var(--G5);
	}
	#options-container {
		top: 0px;
		right: 0px;
		z-index: 5;
		position: absolute;
		margin-top: 35px;
	}
	.option {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
		width: 73px;
		padding: 1px 6px;
	}
	.option span {
		font-size: 12px;
	}
	.option:hover {
		background: var(--G5);
	}
	.expanded {
		margin-bottom: 0px;
	}
	.hover {
		background: var(--G4);
	}
	.inline {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
</style>
