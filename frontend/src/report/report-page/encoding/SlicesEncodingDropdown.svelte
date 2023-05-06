<script lang="ts">
	import { report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let value = 0;
	function initialSettings() {
		// restore default first value when fixing dimension with empty options
		if ($reports[$report].slices.length === 0) {
			$reports[$report].slices = [...Array.from($slices.values()).slice(0, 1)];
		}
		// initial options & values
		[...$slices.values()].forEach((s, i) => {
			options[i] = { value: i, label: s.sliceName };
		});
		value = options.find(
			(o) => o.label === $reports[$report].slices[0].sliceName
		).value;
	}
	$: initialSettings();
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		bind:value
		{options}
		on:change={(e) => {
			if (e.detail.label !== $reports[$report].slices[0].sliceName) {
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
