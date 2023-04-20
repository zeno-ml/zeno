<script lang="ts">
	import { report, reports, metrics } from "../../../stores";
	import Svelecte from "svelecte";
	import { dndzone } from "svelte-dnd-action";
	let options = [];
	let value = [];

	// initial options & values
	[...$metrics.values(), "size"].forEach((m, i) => {
		options[i] = { value: i, label: m };
	});
	$reports[$report].metrics.forEach((m, i) => {
		value[i] = options.find((o) => o.label === m).value;
	});

	function updateDragOrder(val) {
		// check if all elements are numbers (dndzone's place holder)
		if (!val.some((i) => !Number.isInteger(i))) {
			let tmp = [];
			// align by drag order
			val.forEach((v, i) => {
				tmp[i] = options[v].label;
			});
			$reports[$report].metrics = tmp;
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
		multiple={true}
		on:change={(e) => {
			let m = [];
			e.detail.forEach((ed) => {
				m.push(ed.label);
			});
			$reports[$report].metrics = m;
		}}
		placeholder="Select Metrics..." />
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
	:global(.svelecte-control .has-multiSelection .sv-item) {
		--sv-item-selected-bg: var(--P3);
		--sv-item-btn-bg: var(--P3);
	}
</style>
