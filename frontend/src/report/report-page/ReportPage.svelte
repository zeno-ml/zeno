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
	import { ReportType } from "../../zenoservice";

	export let params;
	const ChartMap = {
		[ReportType.BARCHART]: SliceChartReport,
		[ReportType.LINECHART]: TimeseriesReportTable,
		[ReportType.TABLEVIEW]: TableReportTable,
		[ReportType.BEESWARM]: BeeswarmChartReport,
	};

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
				<svelte:component this={ChartMap[currentReport.reportType]} />
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
