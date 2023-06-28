<script lang="ts">
	import LineChartReport from "../report/line-chart/LineChartReport.svelte";
	import BarChartReport from "../report/bar-chart/BarChartReport.svelte";
	import type { ReportChartElement } from "../util/demoMetadata";
	import { ChartType } from "../zenoservice";
	import TableReportTable from "../report/table-report/TableReportTable.svelte";
	import BeeswarmChartReport from "../report/beeswarm-chart/BeeswarmChartReport.svelte";
	import RadarChartReport from "../report/radar-chart/RadarChartReport.svelte";
	import HeatMapReport from "../report/heatmap-chart/HeatMapReport.svelte";
	import { reports } from "../stores";

	const ChartMap = {
		[ChartType.BAR]: BarChartReport,
		[ChartType.LINE]: LineChartReport,
		[ChartType.TABLE]: TableReportTable,
		[ChartType.BEESWARM]: BeeswarmChartReport,
		[ChartType.RADAR]: RadarChartReport,
		[ChartType.HEATMAP]: HeatMapReport,
	};

	export let element: ReportChartElement;
</script>

<svelte:component
	this={ChartMap[$reports[element.reportIndex].type]}
	passedReport={$reports[element.reportIndex]} />
