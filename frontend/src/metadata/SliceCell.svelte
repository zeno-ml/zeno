<script lang="ts">
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import Ripple from "@smui/ripple";
	import { slide } from "svelte/transition";
	import SliceDetails from "../SliceDetails.svelte";
	import { metric, model, slices, transform } from "../stores";
	import { getMetricsForSlices } from "../util";

	export let slice: Slice;
	export let selected = false;
	export let setSelected;
	export let editSlice;

	let expanded = false;

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
	use:Ripple={{ surface: true, color: "primary" }}
	class="cell parent {selected ? 'selected' : ''}"
	on:click={(e) => setSelected(e)}>
	<div class="group" style:width="100%">
		<div class="group" style:width="100%">
			<div class="group" style:width="max-content">
				<div
					style:width="24px"
					style:height="24px"
					style:cursor="pointer"
					style:margin-right="10px">
					<Icon
						component={Svg}
						viewBox="0 0 24 24"
						class="material-icons"
						on:click={(e) => {
							e.stopPropagation();
							expanded = !expanded;
						}}>
						<path
							fill="currentColor"
							d={expanded ? mdiChevronUp : mdiChevronDown} />
					</Icon>
				</div>
				<div>{slice.sliceName}</div>
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
				<div style:cursor="pointer">
					<Icon
						class="material-icons"
						on:click={(e) => {
							e.stopPropagation();
							editSlice(slice);
						}}>
						edit
					</Icon>
					<Icon
						class="material-icons"
						on:click={(e) => {
							e.stopPropagation();
							slices.update((s) => {
								s.delete(slice.sliceName);
								return s;
							});
							fetch("/api/delete-slice/" + encodeURIComponent(slice.sliceName));
						}}>
						delete
					</Icon>
				</div>
			</div>
		</div>
	</div>
	{#if expanded}
		<div in:slide out:slide class="details">
			<SliceDetails sli={slice} />
		</div>
	{/if}
</div>

<style>
	#size {
		font-style: italic;
		color: rgba(0, 0, 0, 0.4);
		margin-right: 10px;
	}
	.details {
		padding-top: 10px;
		margin-left: 10px;
		margin-top: 10px;
		border-top: 1px solid #ccc;
	}
	.cell {
		border: 1px solid #e0e0e0;
		padding: 10px;
		min-width: 400px;
		width: 400px;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.selected {
		background: #ebdffc;
	}
</style>
