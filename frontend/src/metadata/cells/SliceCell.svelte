<script lang="ts">
	import { mdiPencilOutline } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import SliceDetails from "../../SliceDetails.svelte";
	import {
		sliceSelections,
		metric,
		model,
		slices,
		transform,
		sliceToEdit,
		showNewSlice,
	} from "../../stores";
	import { getMetricsForSlices } from "../../util/util";

	export let slice: Slice;
	export let inFolder = false;

	let showTooltip = false;
	$: selected = $sliceSelections.includes(slice.sliceName);

	function setSelected(e) {
		if (
			$sliceSelections.length === 1 &&
			$sliceSelections.includes(slice.sliceName)
		) {
			sliceSelections.set([]);
			return;
		}
		if (e.shiftKey) {
			if ($sliceSelections.includes(slice.sliceName)) {
				sliceSelections.update((sel) => {
					sel.splice(sel.indexOf(slice.sliceName), 1);
					return [...sel];
				});
			} else {
				sliceSelections.update((slis) => [...slis, slice.sliceName]);
			}
		} else {
			if ($sliceSelections.includes(slice.sliceName)) {
				if ($sliceSelections.length > 0) {
					sliceSelections.set([slice.sliceName]);
				} else {
					sliceSelections.update((sel) => {
						sel.splice(sel.indexOf(slice.sliceName), 1);
						return [...sel];
					});
				}
			} else {
				sliceSelections.set([slice.sliceName]);
			}
		}
	}

	$: result = getMetricsForSlices([
		<MetricKey>{
			sli: slice,
			metric: $metric,
			model: $model,
			transform: $transform,
		},
	]);
</script>

<div
	class="{inFolder ? 'in-folder' : ''} cell parent {selected ? 'selected' : ''}"
	on:click={(e) => setSelected(e)}
	draggable="true"
	on:dragstart={(ev) => {
		ev.dataTransfer.setData("text/plain", slice.sliceName);
		ev.dataTransfer.dropEffect = "copy";
	}}
	on:dragend={(ev) => {
		if (ev.dataTransfer.dropEffect === "none") {
			slices.update((sls) => {
				const sli = sls.get(slice.sliceName);
				sli.folder = "";
				sls.set(slice.sliceName, sli);
				return sls;
			});
		}
	}}>
	<div class="group" style:width="100%">
		<div class="group" style:width="100%">
			<div
				class="group"
				style:color="#9b51e0"
				style:width="max-content"
				on:mouseover={() => (showTooltip = true)}
				on:mouseout={() => (showTooltip = false)}
				on:focus={() => (showTooltip = true)}
				on:blur={() => (showTooltip = false)}>
				{slice.sliceName}
			</div>
			<div class="group">
				{#if result}
					<span style:margin-right="10px">
						{#await result then res}
							{res ? res[0].toFixed(2) : ""}
						{/await}
					</span>
					<span id="size">
						({slice.idxs.length})
					</span>
				{/if}
				<div class="inline" style:cursor="pointer">
					<div
						style="width: 24px; height: 24px"
						on:click={(e) => {
							e.stopPropagation();
							sliceToEdit.set(slice);
							showNewSlice.set(true);
						}}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiPencilOutline} />
						</Icon>
					</div>
					<Icon
						class="material-icons"
						on:click={(e) => {
							e.stopPropagation();
							sliceSelections.update((s) => {
								s.splice(s.indexOf(slice.sliceName), 1);
								return s;
							});
							slices.update((s) => {
								s.delete(slice.sliceName);
								return s;
							});
						}}>
						delete_outline
					</Icon>
				</div>
			</div>
		</div>
	</div>
	{#if showTooltip}
		<div class="tooltip-container">
			<div class="tooltip">
				<SliceDetails predicateGroup={slice.filterPredicates} />
			</div>
		</div>
	{/if}
</div>

<style>
	.tooltip-container {
		z-index: 5;
		background: white;
		margin-top: 10px;
		position: absolute;
		height: max-content;
	}
	.tooltip {
		background: white;
		padding: 10px;
		box-shadow: 1px 1px 3px 1px #ccc;
		border-radius: 3px;
	}
	#size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
	.cell {
		overflow: visible;
		border: 1px solid #e0e0e0;
		padding: 10px;
		margin-right: 10px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
	.selected {
		background: #f9f5ff;
	}
	.inline {
		display: flex;
		flex-direction: row;
	}
	.in-folder {
		margin-left: 25px;
	}
</style>
