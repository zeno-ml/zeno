<script lang="ts">
	import { report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let value = [];
	$slices.forEach((s, i) => {
		if ($reports[$report].slices.some((rs) => rs.sliceName === s.sliceName)) {
			value.push(i);
		}
		options.push({ value: i, label: s.sliceName });
	});
	console.log(value, options);
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 260px; flex:none;"
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
