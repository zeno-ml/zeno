<script lang="ts">
	import { report, reports, metrics } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	let value = 0;
	function initialSettings() {
		// restore all value when fixing dimension with empty options
		if ($reports[$report].metrics.length === 0) {
			$reports[$report].metrics = [$metrics[0]];
		}
		// initial options & values
		[...$metrics.values(), "slice size"].forEach((m, i) => {
			options[i] = { value: i, label: m };
		});
		value = options.find((o) => o.label === $reports[$report].metrics[0]).value;
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
			if (e.detail && e.detail.label !== $reports[$report].metrics[0]) {
				let tmpMetrics = $reports[$report].metrics;
				if (tmpMetrics.includes(e.detail.label)) {
					tmpMetrics.splice(tmpMetrics.indexOf(e.detail.label), 1);
				}
				tmpMetrics.unshift(e.detail.label);
				$reports[$report].metrics = tmpMetrics;
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
