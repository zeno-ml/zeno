<script lang="ts">
	import { report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	import { dndzone } from "svelte-dnd-action";

	let options = [];
	let value = [];

	// initial options & values
	[...$slices.keys()].forEach((s, i) => {
		options[i] = { value: i, label: s };
	});
	$reports[$report].slices.forEach((s, i) => {
		value[i] = options.find((o) => o.label === s).value;
	});

	function updateDragOrder(val) {
		// check if all elements are numbers (dndzone's place holder)
		if (!val.some((i) => !Number.isInteger(i))) {
			let tmp = [];
			// align by drag order
			val.forEach((v, i) => {
				tmp[i] = options[v].label;
			});
			$reports[$report].slices = tmp;
		}
	}

	$: updateDragOrder(value);
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		bind:value
		{options}
		{dndzone}
		multiple
		on:change={(e) => {
			let s = [];
			e.detail.forEach((ed) => {
				s.push(ed.label);
			});
			$reports[$report].slices = s;
		}}
		placeholder="Select Slices..." />
</div>

<style>
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.select-label {
		margin: 5px;
	}

	:global(#dnd-action-dragged-el .sv-item) {
		--sv-item-selected-bg: var(--P3);
		--sv-item-btn-bg: var(--P3);
	}
	:global(div[role="listitem"]) {
		outline: none;
	}
</style>
