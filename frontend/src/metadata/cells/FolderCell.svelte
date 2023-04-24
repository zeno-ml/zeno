<script lang="ts">
	import { mdiChevronDown, mdiDotsHorizontal, mdiChevronUp } from "@mdi/js";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import Paper, { Content } from "@smui/paper";
	import { slide } from "svelte/transition";
	import { folders, slices } from "../../stores";
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
		const data = ev.dataTransfer.getData("text/plain");
		slices.update((sls) => {
			const sli = sls.get(data);
			sli.folder = folder;
			sls.set(data, sli);
			ZenoService.createNewSlice({
				sliceName: sli.sliceName,
				filterPredicates: sli.filterPredicates,
				folder: folder,
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
				<path fill="black" d={expandFolder ? mdiChevronDown : mdiChevronUp} />
			</Icon>
		</div>
		{folder}
	</div>
	<div class="inline">
		{#if showOptions}
			<div
				id="options-container"
				use:clickOutside
				on:click_outside={() => (showOptions = !showOptions)}>
				<Paper style="padding: 3px 0px;" elevation={7}>
					<Content>
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
			<SliceCell slice={s} inFolder={true} />
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
