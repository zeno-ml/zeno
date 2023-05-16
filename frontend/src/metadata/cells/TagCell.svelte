<script lang="ts">
	import { mdiDotsHorizontal } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import { deleteTag, getMetricsForTags } from "../../api/tag";
	import {
		editId,
		metric,
		model,
		selections,
		status,
		tagIds,
		tags,
	} from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import type { Tag, TagMetricKey } from "../../zenoservice";
	export let tag: Tag;
	export let inFolder = false;

	let result;

	let confirmDelete = false;
	let relatedReports = 0;

	let showTooltip = false;
	let hovering = false;
	let showOptions = false;

	$: selected = $selections.tags.includes(tag.tagName);
	$: {
		$status;
		result = getMetricsForTags([
			<TagMetricKey>{
				tag: tag,
				model: $model,
				metric: $metric,
			},
		]);
	}

	function removeTag() {
		confirmDelete = false;
		relatedReports = 0;

		selections.update((m) => {
			for (let key in m.metadata) {
				m.metadata[key] = { predicates: [], join: "&" };
			}
			return { slices: [], metadata: { ...m.metadata }, tags: [] };
		});
		tags.update((t) => {
			t.delete(tag.tagName);
			return t;
		});
		tagIds.set({ ids: [] });
		deleteTag(tag.tagName);
	}

	function updateTagIdsAfterRemove() {
		let s = new Set();
		//loop through all selectedTags and re-add their IDs (assumes that the selections.tags will already be updated)
		//this is to catch for the case when you have intersections between tags
		$selections.tags.forEach((tag) =>
			$tags.get(tag).selectionIds.ids.forEach((id) => s.add(id))
		);
		let finalArray = [];
		s.forEach((id) => finalArray.push(id));
		tagIds.set({ ids: finalArray });
	}

	function addTagIdsToTagIds(tagName) {
		let s = new Set();
		$tagIds.ids.forEach((id) => s.add(id));

		$tags.get(tagName).selectionIds.ids.forEach((id) => s.add(id));
		let finalArray = [];
		s.forEach((id) => finalArray.push(id));
		tagIds.set({ ids: finalArray });
	}

	function setSelected(e) {
		// Imitate selections in Vega bar charts.
		if (
			$selections.tags.length === 1 &&
			$selections.tags.includes(tag.tagName)
		) {
			selections.update((s) => ({
				slices: s.slices,
				metadata: s.metadata,
				tags: [],
			}));
			updateTagIdsAfterRemove();
			return;
		}
		if (e.shiftKey) {
			if ($selections.tags.includes(tag.tagName)) {
				selections.update((sel) => {
					sel.tags.splice(sel.tags.indexOf(tag.tagName), 1);
					return {
						slices: sel.slices,
						metadata: sel.metadata,
						tags: [...sel.tags],
					};
				});
				updateTagIdsAfterRemove();
			} else {
				selections.update((sel) => ({
					slices: sel.slices,
					metadata: sel.metadata,
					tags: [...sel.tags, tag.tagName],
				}));
				addTagIdsToTagIds(tag.tagName);
			}
		} else {
			if ($selections.tags.includes(tag.tagName)) {
				if ($selections.tags.length > 0) {
					selections.update((sel) => ({
						slices: sel.slices,
						metadata: sel.metadata,
						tags: [tag.tagName],
					}));
					tagIds.set({ ids: [] });
					addTagIdsToTagIds(tag.tagName);
				} else {
					selections.update((sel) => {
						sel.tags.splice(sel.tags.indexOf(tag.tagName), 1);
						console.log(sel.tags);
						return {
							slices: sel.slices,
							metadata: sel.metadata,
							tags: [...sel.tags],
						};
					});
					updateTagIdsAfterRemove();
				}
			} else {
				selections.update((sel) => ({
					slices: sel.slices,
					metadata: sel.metadata,
					tags: [tag.tagName],
				}));
				tagIds.set({ ids: [] });
				addTagIdsToTagIds(tag.tagName);
			}
		}
	}
</script>

<div
	class="{inFolder ? 'in-folder' : ''} cell parent {selected ? 'selected' : ''}"
	on:click={(e) => setSelected(e)}
	draggable="true"
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}
	on:dragstart={(ev) => {
		ev.dataTransfer.setData("text/plain", tag.tagName);
		ev.dataTransfer.dropEffect = "copy";
	}}
	on:keydown={() => ({})}>
	<div class="group" style:width="100%">
		<div class="group" style:width="100%">
			<div class="inline">
				<div
					class="group"
					style:color="var(--G1)"
					on:mouseover={() => (showTooltip = true)}
					on:mouseout={() => (showTooltip = false)}
					on:focus={() => (showTooltip = true)}
					on:blur={() => (showTooltip = false)}>
					{tag.tagName}
				</div>
			</div>
			<div
				class="group"
				use:clickOutside
				on:click_outside={() => {
					showOptions = false;
				}}>
				{#if showOptions}
					<div id="options-container">
						<Paper style="padding: 3px 0px;" elevation={7}>
							<Content>
								{#if $editId === undefined}
									<div
										class="option"
										on:keydown={() => ({})}
										on:click={(e) => {
											e.stopPropagation();
											showOptions = false;
											editId.set(tag.tagName);
										}}>
										<Icon style="font-size: 18px;" class="material-icons"
											>edit</Icon
										>&nbsp;
										<span>Edit</span>
									</div>
								{/if}
								<div
									class="option"
									on:keydown={() => ({})}
									on:click={(e) => {
										e.stopPropagation();
										showOptions = false;
										removeTag();
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
				{#if result}
					{#await result then res}
						<span style:margin-right="10px">
							{res[0].metric !== undefined && res[0].metric !== null
								? res[0].metric.toFixed(2)
								: ""}
						</span>
						<span id="size">
							({res[0].size.toLocaleString()})
						</span>
					{/await}
				{/if}
				{#if $editId !== tag.tagName}
					<div class="inline" style:cursor="pointer">
						<div
							style:width="36px"
							use:clickOutside
							on:click_outside={() => {
								hovering = false;
							}}>
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
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	#size {
		font-style: italic;
		color: var(--G3);
		margin-right: 10px;
	}
	.cell {
		position: relative;
		overflow: visible;
		border: 0.5px solid var(--G4);
		border-radius: 4px;
		margin-top: 5px;
		display: flex;
		padding-left: 10px;
		padding-right: 10px;
		min-height: 36px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
	.selected {
		background: var(--N2);
	}
	.inline {
		display: flex;
		flex-direction: row;
	}
	.in-folder {
		margin-left: 35px;
		margin-top: 0px;
		margin-bottom: 0px;
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
</style>
