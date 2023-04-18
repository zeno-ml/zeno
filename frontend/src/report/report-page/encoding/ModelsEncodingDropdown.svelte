<script lang="ts">
	import { report, reports, models } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	function initialSettings() {
		// restore all value when fixing dimension with empty options
		if ($reports[$report].models.length === 0) {
			$reports[$report].models = [$models[0]];
		}
		// prepare options
		$models.forEach((m) => {
			options.push({ label: m });
		});
	}
	$: initialSettings();
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		value={$reports[$report].models[0]}
		{options}
		on:change={(e) => {
			if (e.detail.label !== $reports[$report].models[0]) {
				let tmpModels = $reports[$report].models;
				if (tmpModels.includes(e.detail.label)) {
					tmpModels.splice(tmpModels.indexOf(e.detail.label), 1);
				}
				tmpModels.unshift(e.detail.label);
				$reports[$report].models = tmpModels;
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
