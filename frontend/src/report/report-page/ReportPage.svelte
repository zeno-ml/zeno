<script lang="ts">
	import { onMount } from "svelte";
	import { ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import EditHeader from "./report-header/EditHeader.svelte";
	import ViewHeader from "./report-header/ViewHeader.svelte";
	import BarChartReport from "../bar-chart/BarChartReport.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import LineChartReport from "../line-chart/LineChartReport.svelte";
	import RadarChartReport from "../radar-chart/RadarChartReport.svelte";
	import HeatMapReport from "../heatmap-chart/HeatMapReport.svelte";
	import ViewSelection from "./view-selection/ViewSelection.svelte";
	import Encoding from "./encoding/Encoding.svelte";
	import { ChartType } from "../../zenoservice";

	export let params;

	let isReportEdit = false;

	const ChartMap = {
		[ChartType.BAR]: BarChartReport,
		[ChartType.LINE]: LineChartReport,
		[ChartType.TABLE]: TableReportTable,
		[ChartType.BEESWARM]: BeeswarmChartReport,
		[ChartType.RADAR]: RadarChartReport,
		[ChartType.HEATMAP]: HeatMapReport,
	};
	onMount(() => {
		if (window.location.href.split("/").slice(-2, -1)[0] === "new") {
			isReportEdit = true;
		}
	});

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<div id="report-panel" class={isReportEdit ? "row-flex" : "col-flex"}>
			{#if isReportEdit}
				<div id="edit-bar">
					<EditHeader bind:isReportEdit />
					<ViewSelection />
					<Encoding />
				</div>
			{:else}
				<ViewHeader bind:isReportEdit />
			{/if}
			<div id="reports" class={isReportEdit ? "edit-reports" : ""}>
				<svelte:component this={ChartMap[currentReport.type]} />
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh);
	}
	#report-panel {
		width: 100%;
		display: flex;
		overflow: hidden;
	}
	.row-flex {
		flex-direction: row;
	}
	.col-flex {
		flex-direction: column;
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
		height: calc(100vh - 15px);
		overflow: scroll;
		display: flex;
		flex-direction: column;
		padding-top: 10px;
		padding-left: 15px;
	}
	.edit-reports {
		width: 100%;
	}
</style>
