<script lang="ts">
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "./report-header/ReportHeader.svelte";
	import SliceChartReport from "../slice-chart/SliceChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "../timeseries-report/TimeseriesReportTable.svelte";
	import Beeswarm from "./chart-icons/BeeswarmIcon.svelte";
	import BarChart from "./chart-icons/BarChartIcon.svelte";
	import LineChart from "./chart-icons/LineChartIcon.svelte";
	import TableView from "./chart-icons/TableViewIcon.svelte";

	export let params;

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<ReportHeader reportId={params.id} />
		<div id="report-panel">
			<div id="edit-bar">
				<div class="chart-type">
					<h4>Chart Type</h4>
					<div class="chart-flex">
						<div
							id="slicechart"
							class="chart-element"
							on:keydown={() => ({})}
							on:click={(e) => {
								if (e.currentTarget instanceof HTMLElement) {
									currentReport.reportType = e.currentTarget.id;
								}
							}}>
							<BarChart />
							<h4 class="chart-title">Bar Chart</h4>
						</div>
						<div
							id="timeseries"
							class="chart-element"
							on:keydown={() => ({})}
							on:click={(e) => {
								if (e.currentTarget instanceof HTMLElement) {
									currentReport.reportType = e.currentTarget.id;
								}
							}}>
							<LineChart />
							<h4 class="chart-title">Line Chart</h4>
						</div>
						<div
							id="table"
							class="chart-element"
							on:keydown={() => ({})}
							on:click={(e) => {
								if (e.currentTarget instanceof HTMLElement) {
									currentReport.reportType = e.currentTarget.id;
								}
							}}>
							<TableView />
							<h4 class="chart-title">Table View</h4>
						</div>
						<div
							id="beeswarm"
							class="chart-element"
							on:keydown={() => ({})}
							on:click={(e) => {
								if (e.currentTarget instanceof HTMLElement) {
									currentReport.reportType = e.currentTarget.id;
								}
							}}>
							<Beeswarm />
							<h4 class="chart-title">Beeswarm Plot</h4>
						</div>
					</div>
				</div>
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
