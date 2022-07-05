<script lang="ts">
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import Ripple from "@smui/ripple";
	import { slide } from "svelte/transition";
	import SliceDetails from "../SliceDetails.svelte";
	import { slices } from "../stores";

	export let slice: Slice;
	export let result: number;
	export let selected = false;
	export let setSelected;
	export let editSlice;

	let expanded = false;
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
						{result.toFixed(2)}
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
		width: fit-content;
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
