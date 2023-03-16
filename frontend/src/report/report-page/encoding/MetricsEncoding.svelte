<script lang="ts">
	import { report, reports, metrics } from "../../../stores";
	import { ChartType } from "../../../zenoservice";
	import Svelecte from "svelecte";
	let options = [];
	$metrics.forEach((m) => {
		options.push({ label: m });
	});
</script>

<div class="parameters">
	<h4 class="select-label">
		{$reports[$report].type !== ChartType.TABLE ? "" : "metrics"}
	</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		value={$reports[$report].metrics}
		{options}
		searchable={false}
		on:change={(e) => {
			if (e.detail.label !== $reports[$report].metrics) {
				$reports[$report].metrics = e.detail.label;
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
