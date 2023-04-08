<script lang="ts">
	import { report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let selectSliceName = "";
	function initialSettings() {
		// restore all value when fixing dimension with empty options
		if ($reports[$report].slices.length === 0) {
			$reports[$report].slices = [...$slices.values()];
		}
		// prepare options
		$slices.forEach((s) => {
			if ($reports[$report].slices.some((rs) => rs.sliceName === s.sliceName)) {
				options.push({ label: s.sliceName });
			}
		});
		selectSliceName = $reports[$report].slices[0].sliceName;
	}
	$: initialSettings();
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		value={selectSliceName}
		{options}
		searchable={false}
		on:change={(e) => {
			if (e.detail.label !== selectSliceName) {
				let tmpSlices = $reports[$report].slices;
				tmpSlices = tmpSlices.filter((p) => p.sliceName !== e.detail.label);
				tmpSlices.unshift($slices.get(e.detail.label));
				$reports[$report].slices = tmpSlices;
			}
		}} />
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
</style>
