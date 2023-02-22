<script lang="ts">
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "./report-header/ReportHeader.svelte";
	import SliceChartReport from "../slice-chart/SliceChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "../timeseries-report/TimeseriesReportTable.svelte";
	import ChartType from "./chart-type/ChartType.svelte";

	export let params;

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<ReportHeader reportId={params.id} />
		<div id="report-panel">
			<div id="edit-bar">
				<ChartType reportId={$report} />
			</div>
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
	#report-panel {
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	#edit-bar {
		width: 350px;
		height: calc(100vh - 100px);
		border: 1px solid var(--G5);
		margin-left: 20px;
		border-radius: 10px;
		padding: 10px 20px 10px 20px;
	}
	.chart-flex {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
	}
	.chart-element {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--G4);
		height: 80px;
		width: 140px;
		border-radius: 10px;
		align-items: center;
		padding: 10px;
		margin: 5px;
	}
	.chart-element:hover {
		cursor: pointer;
		background: var(--P3);
	}
	.chart-title {
		margin: 5px 0px 0px 0px;
	}

	#reports {
		display: flex;
		flex-direction: column;
		padding: 20px;
	}
</style>
