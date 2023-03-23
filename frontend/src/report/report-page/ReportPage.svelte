<script lang="ts">
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "./report-header/ReportHeader.svelte";
	import BarChartReport from "../bar-chart/BarChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import LineChartReport from "../line-chart/LineChartReport.svelte";
	import RadarChartReport from "../radar-chart/RadarChartReport.svelte";
	import ViewSelection from "./view-selection/ViewSelection.svelte";
	import Encoding from "./encoding/Encoding.svelte";
	import { ChartType } from "../../zenoservice";

	export let params;

	const ChartMap = {
		[ChartType.BAR]: BarChartReport,
		[ChartType.LINE]: LineChartReport,
		[ChartType.TABLE]: TableReportTable,
		[ChartType.BEESWARM]: BeeswarmChartReport,
		[ChartType.RADAR]: RadarChartReport,
	};

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<div id="report-panel">
			<div id="edit-bar">
				<ReportHeader />
				<ViewSelection />
				<Encoding />
			</div>
			<div id="reports">
				<svelte:component this={ChartMap[currentReport.type]} />
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
		width: 100%;
		height: calc(100vh - 15px);
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		padding-top: 10px;
		padding-bottom: 0px;
		padding-left: 15px;
		padding-right: 15px;
	}
</style>
