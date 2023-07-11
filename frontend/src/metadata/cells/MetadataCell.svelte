<script lang="ts">
	import { mdiDotsHorizontal } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import Dialog, { Actions, Content, InitialFocus, Title } from "@smui/dialog";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper from "@smui/paper";
	import type { HistogramEntry } from "../../api/metadata";
	import { folders, selections, slices } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import { columnHash } from "../../util/util";
	import {
		MetadataType,
		ZenoColumnType,
		type FilterPredicate,
		type FilterPredicateGroup,
		type ZenoColumn,
	} from "../../zenoservice";
	import { createSlices } from "./MetadataCellUtil";
	import BinaryMetadataCell from "./metadata-cells/BinaryMetadataCell.svelte";
	import ContinuousMetadataCell from "./metadata-cells/ContinuousMetadataCell.svelte";
	import NominalMetadataCell from "./metadata-cells/NominalMetadataCell.svelte";
	import TextMetadataCell from "./metadata-cells/TextMetadataCell.svelte";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];
	export let body: HTMLElement;

	const columnMap = {
		[MetadataType.NOMINAL]: NominalMetadataCell,
		[MetadataType.CONTINUOUS]: ContinuousMetadataCell,
		[MetadataType.BOOLEAN]: BinaryMetadataCell,
		[MetadataType.DATETIME]: TextMetadataCell,
		[MetadataType.OTHER]: TextMetadataCell,
	};

	let hovering = false;
	let showOptions = false;
	let duplicateSlices = false;
	let duplicateFolders = false;
	let duplicateNames = [];

	let filterPredicates: FilterPredicateGroup;
	$: filterPredicates = $selections.metadata[columnHash(col)]
		? $selections.metadata[columnHash(col)]
		: { predicates: [], join: "" };
	let predicates: FilterPredicate[] = [];
	$: predicates = filterPredicates.predicates as FilterPredicate[];

	function updatePredicates(predicates: FilterPredicate[]) {
		selections.update((mets) => ({
			slices: mets.slices,
			metadata: {
				...mets.metadata,
				[columnHash(col)]: { predicates, join: "" },
			},
			tags: mets.tags,
		}));
	}

	function checkSliceNames() {
		let sliceName = "";
		let duplicateNames = [];
		histogram.forEach((h) => {
			$slices.forEach((slice) => {
				if (col.metadataType === MetadataType.NOMINAL) {
					sliceName = col.name + " == " + h.bucket;
				} else if (col.metadataType === MetadataType.CONTINUOUS) {
					sliceName =
						Number(h.bucket).toFixed(2) +
						" <= " +
						col.name +
						" < " +
						Number(h.bucketEnd).toFixed(2);
				} else if (col.metadataType === MetadataType.BOOLEAN) {
					const value = h.bucket ? "true" : "false";
					sliceName = col.name + " == " + value;
				}
				if (slice.sliceName === sliceName) {
					duplicateNames.push(slice.sliceName);
				}
			});
		});
		return duplicateNames;
	}

	function confirmCreate() {
		duplicateNames = [];
		createSlices(col, histogram);
		if (body) {
			body.scrollTop = 0;
		}
	}
</script>

{#if histogram}
	<div
		class="cell"
		on:mouseover={() => (hovering = true)}
		on:focus={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
		on:blur={() => (hovering = false)}>
		<div
			class="info"
			use:clickOutside
			on:click_outside={() => (showOptions = false)}>
			<div class="label top-text">
				<span>
					{col.columnType === ZenoColumnType.OUTPUT ? "output" : col.name}
				</span>
			</div>
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
									$folders.forEach((f) => {
										if (f === col.name + "s") {
											duplicateFolders = true;
										}
									});
									if (!duplicateFolders) {
										duplicateNames = checkSliceNames();
										if (duplicateNames.length > 0) {
											duplicateSlices = true;
										} else {
											confirmCreate();
										}
									}
								}}>
								<Icon style="font-size: 18px;" class="material-icons">edit</Icon
								>&nbsp;
								<span>Create Slices</span>
							</div>
						</Content>
					</Paper>
				</div>
			{/if}
			{#if histogram.length > 0 && hovering}
				<div
					class="inline"
					style="cursor:pointer"
					use:clickOutside
					on:click_outside={() => {
						hovering = false;
					}}>
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
				</div>
			{/if}
		</div>

		<svelte:component
			this={columnMap[col.metadataType]}
			filterPredicates={predicates}
			{updatePredicates}
			{col}
			{histogram} />
	</div>
{/if}

<Dialog bind:open={duplicateSlices} scrimClickAction="" escapeKeyAction="">
	<Title>Create Metadata Slices</Title>
	<Content>
		These slices "{duplicateNames.join(", ")}" already exists. Replace them &
		Continue?
	</Content>
	<Actions>
		<Button on:click={() => (duplicateSlices = false)}>
			<Label>No</Label>
		</Button>
		<Button use={[InitialFocus]} on:click={() => confirmCreate()}>
			<Label>Yes</Label>
		</Button>
	</Actions>
</Dialog>

<Dialog bind:open={duplicateFolders}>
	<Title>Create Metadata Slices</Title>
	<Content>
		There is an existing folder named "{col.name + "s"}".<br /> Please change the
		naming before creating metadata slices.
	</Content>
	<Actions>
		<Button
			use={[InitialFocus]}
			on:click={() => {
				duplicateFolders = false;
				duplicateSlices = false;
			}}>
			<Label>Got It!</Label>
		</Button>
	</Actions>
</Dialog>

<style>
	.cell {
		position: relative;
		border-top: 0.5px solid #ebebea;
		border-bottom: 0.5px solid #ebebea;
		padding: 10px 0px 10px 0px;
		display: flex;
		flex-direction: column;
	}
	.info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 16px;
		margin-left: 5px;
		margin-bottom: 10px;
		color: var(--G2);
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
		align-items: center;
		cursor: pointer;
		width: 100px;
		padding: 1px 6px;
	}
	.option span {
		font-size: 12px;
	}
	.option:hover {
		background: var(--G5);
	}
	.inline {
		display: flex;
		align-items: center;
	}
</style>
