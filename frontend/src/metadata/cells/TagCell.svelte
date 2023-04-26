<script lang="ts">
	import { mdiPencilOutline, mdiDotsHorizontal } from "@mdi/js";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import {
		editId,
		status,
		selections,
		tags,
		tagIds,
		model,
		metric,
	} from "../../stores";
	import { getMetricsForTags, deleteTag } from "../../api/tag";
	import type { TagMetricKey, Tag } from "../../zenoservice";

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
	<!-- add this back in once decide to do with tagFolders
        on:dragend={(ev) => {
		if (ev.dataTransfer.dropEffect === "none") {
			slices.update((sls) => {
				const sli = sls.get(slice.sliceName);
				sli.folder = "";
				sls.set(slice.sliceName, sli);
				createNewSlice(sli.sliceName, sli.filterPredicates);
				return sls;
			});
		}
	}} -->
	<!-- {#if showTooltip}
		<div class="tooltip-container">
			<div class="tooltip">
				<SliceDetails predicateGroup={slice.filterPredicates} />
			</div>
		</div>
	{/if} -->

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
			<div class="group">
				{#if showOptions}
					<div
						id="options-container"
						on:mouseleave={() => (showOptions = false)}
						on:blur={() => (showOptions = false)}>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								removeTag();
							}}>
							<Icon class="material-icons">delete_outline</Icon>
						</IconButton>
						{#if $editId === undefined}
							<IconButton
								on:click={(e) => {
									e.stopPropagation();
									showOptions = false;
									editId.set(tag.tagName);
								}}>
								<Icon component={Svg} viewBox="0 0 24 24">
									<path fill="black" d={mdiPencilOutline} />
								</Icon>
							</IconButton>
						{/if}
					</div>
				{/if}
				{#if result}
					{#await result then res}
						<span style:margin-right="10px">
							{res[0].metric !== undefined ? res[0].metric.toFixed(2) : ""}
						</span>
						<span id="size">
							({res[0].size.toLocaleString()})
						</span>
					{/await}
				{/if}
				{#if $editId !== tag.tagName}
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
		background: var(--G6);
		margin-top: -7px;
		border: 1px solid var(--G5);
		position: absolute;
		height: max-content;
		display: flex;
		border-radius: 4px;
	}
</style>
