<script lang="ts">
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import { slide } from "svelte/transition";
	import { folders, slices } from "../stores";
	import SliceCell from "./SliceCell.svelte";

	export let folder: string;

	$: sls = [...$slices.values()].filter((s) => s.folder === folder);

	let expandFolder = false;
	let dragOver = false;
</script>

<div
	class="cell {dragOver ? 'hover' : ''}"
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
			return sls;
		});
	}}>
	<div class="inline">
		<div
			style="width: 24px; height: 24px; cursor: pointer; margin-right: 10px;"
			on:click={() => (expandFolder = !expandFolder)}>
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={expandFolder ? mdiChevronDown : mdiChevronUp} />
			</Icon>
		</div>
		{folder}
	</div>
	<div class="inline">
		<div style:margin-right="10px">
			{sls.length} slice{sls.length === 1 ? "" : "s"}
		</div>
		<div style:cursor="pointer">
			<Icon
				class="material-icons"
				on:click={(e) => {
					e.stopPropagation();
					slices.update((sls) => {
						let inFolder = [...sls.values()].filter((d) => d.folder === folder);
						inFolder.forEach((slice) => {
							slice.folder = "";
							sls.set(slice.sliceName, slice);
						});
						return sls;
					});
					folders.update((folders) => {
						folders.splice(folders.indexOf(folder), 1);
						fetch("/api/set-folders", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(folders),
						});
						return folders;
					});
				}}>
				delete_outline
			</Icon>
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
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border: 1px solid #e0e0e0;
		padding: 10px;
		margin-right: 10px;
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
