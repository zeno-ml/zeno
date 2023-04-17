<script lang="ts">
	import { report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let value = [];
	let index = 0;

	$reports[$report].slices.forEach((s, i) => {
		value.push(i);
		options.push({ value: i, label: s.sliceName });
		index = i;
	});
	$slices.forEach((s) => {
		if (!$reports[$report].slices.find((rs) => rs.sliceName === s.sliceName)) {
			options.push({ value: index + 1, label: s.sliceName });
			index += 1;
		}
	});
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		{value}
		{options}
		multiple={true}
		on:change={(e) => {
			let s = [];
			e.detail.forEach((ed) => {
				s.push($slices.get(ed.label));
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
	:global(.svelecte-control .has-multiSelection .sv-item) {
		--sv-item-selected-bg: var(--P3);
		--sv-item-btn-bg: var(--P3);
	}
</style>
