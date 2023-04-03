<script lang="ts">
	import { report, reports, metrics } from "../../../stores";
	import Svelecte from "svelecte";
	let options = [];
	[...$metrics.values(), "size"].forEach((m) => {
		if ($reports[$report].metrics.includes(m)) {
			options.push({ label: m });
		}
	});
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		value={$reports[$report].metrics[0]}
		{options}
		searchable={false}
		on:change={(e) => {
			if (e.detail.label !== $reports[$report].metrics[0]) {
				let tmpMetrics = $reports[$report].metrics;
				tmpMetrics.splice(tmpMetrics.indexOf(e.detail.label), 1);
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
