<script lang="ts">
	import { mdiChartLine, mdiTable } from "@mdi/js";
	import { Icon } from "@smui/button";
	import { Svg } from "@smui/common/elements";
	import IconButton from "@smui/icon-button";
	import { report as selectedReport, reports } from "../stores";

	export let report;
	export let reportIndex;

	let iconMap = {
		table: mdiTable,
		timeseries: mdiChartLine,
	};
</script>

<div
	class="report {$selectedReport === reportIndex ? 'selected' : ''}"
	on:click={() => selectedReport.set(reportIndex)}>
	<div class="report-name">
		<IconButton>
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={iconMap[report.reportType]} />
			</Icon>
		</IconButton>
		<p>{report.name}</p>
	</div>

	<div class="options">
		<p style:margin-right="10px">{report.reportPredicates.length} slices</p>
		<div class="group">
			<div>
				<IconButton
					on:click={(e) => {
						e.stopPropagation();
						reports.update((reps) => {
							reps.splice(reportIndex, 1);
							return reps;
						});
					}}>
					<Icon class="material-icons">delete_outline</Icon>
				</IconButton>
			</div>
		</div>
	</div>
</div>

<style>
	.report {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid #e0e0e0;
		border-radius: 5px;
		margin-top: 5px;
		margin-bottom: 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
	}
	.selected {
		background: #f9f5ff;
	}
	.options {
		display: flex;
		flex-direction: inline;
		align-items: center;
	}
	.report-name {
		display: flex;
		align-items: center;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
</style>
