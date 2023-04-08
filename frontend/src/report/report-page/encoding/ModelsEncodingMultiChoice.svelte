<script lang="ts">
	import { report, reports, models } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let value = [];
	$models.forEach((m, i) => {
		if ($reports[$report].models.includes(m)) {
			value.push(i);
		}
		options.push({ value: i, label: m });
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
			let m = [];
			e.detail.forEach((ed) => {
				m.push(ed.label);
			});
			$reports[$report].models = m;
		}}
		placeholder="Select Models..." />
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
