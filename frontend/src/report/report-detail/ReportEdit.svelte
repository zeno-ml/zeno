<script lang="ts">
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "../report-header/ReportHeader.svelte";
	import SliceChartReport from "../slice-chart/SliceChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "../timeseries-report/TimeseriesReportTable.svelte";

	export let params;

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<ReportHeader reportId={params.id} />
		<div id="report-panel">
			<div id="edit-bar" />
			<div id="reports">
				{#if currentReport}
					{#if currentReport.reportType === "timeseries"}
						<TimeseriesReportTable reportId={$report} />
					{:else if currentReport.reportType === "slicechart"}
						<SliceChartReport reportId={$report} />
					{:else if currentReport.reportType === "beeswarm"}
						<BeeswarmChartReport reportId={$report} />
					{:else}
						<TableReportTable reportId={$report} />
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 80px);
	}
	#edit-bar {
		display: flex;
		width: 400px;
		height: calc(100vh - 100px);
		border: 1px solid lightgray;
		margin-left: 20px;
	}
	#reports {
		display: flex;
		flex-direction: column;
	}
	#report-panel {
		width: 100%;
		display: flex;
		flex-direction: row;
	}
</style>
