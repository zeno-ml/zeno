<script lang="ts">
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "./report-header/ReportHeader.svelte";
	import SliceChartReport from "../slice-chart/SliceChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "../timeseries-report/TimeseriesReportTable.svelte";
	import ChartType from "./chart-type/ChartType.svelte";
	import Encoding from "./encoding/Encoding.svelte";
	import Marks from "./marks/Marks.svelte";

	export let params;

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<div id="report-panel">
			<div id="edit-bar">
				<ReportHeader />
				<ChartType />
				<Encoding />
				<Marks />
			</div>
			<div id="reports">
				{#if currentReport}
					{#if currentReport.reportType === "timeseries"}
						<TimeseriesReportTable />
					{:else if currentReport.reportType === "slicechart"}
						<SliceChartReport />
					{:else if currentReport.reportType === "beeswarm"}
						<BeeswarmChartReport />
					{:else}
						<TableReportTable />
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
		height: calc(100vh - 15px);
		width: 370px;
		min-width: 370px;
		max-width: 370px;
		padding-top: 10px;
		padding-bottom: 0px;
		padding-left: 15px;
		padding-right: 15px;
		overflow-y: scroll;
		background-color: var(--Y2);
	}
	#reports {
		display: flex;
		flex-direction: column;
		padding: 20px;
	}
</style>
