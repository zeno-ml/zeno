<script lang="ts">
	import { mdiBee, mdiChartBar, mdiChartLine, mdiTable } from "@mdi/js";
	import { Icon } from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton from "@smui/icon-button";
	import { reports } from "../stores";
	import { updateTab } from "../util/util";
	import { ReportType } from "../zenoservice";

	export let report;
	export let reportIndex;

	let iconMap = {
		[ReportType.TABLEVIEW]: mdiTable,
		[ReportType.LINECHART]: mdiChartLine,
		[ReportType.BARCHART]: mdiChartBar,
		[ReportType.BEESWARM]: mdiBee,
	};
</script>

<div
	class="report"
	on:click={() => updateTab("report/" + reportIndex)}
	on:keydown={() => ({})}>
	<IconButton>
		<Icon component={Svg} viewBox="0 0 24 24">
			<path fill="black" d={iconMap[report.reportType]} />
		</Icon>
	</IconButton>
	<p class="report-name">{report.name}</p>
	<p class="report-slice">{report.reportPredicates.length} slices</p>
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

<style>
	.report {
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid var(--G4);
		border-radius: 10px;
		margin: 5px 5px 5px 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
		width: 150px;
		height: 150px;
	}
	.report:hover {
		background: var(--P3);
	}
	.report-name {
		margin: 3px;
		font-size: 16px;
		color: black;
	}
	.report-slice {
		margin: 3px;
	}
</style>
