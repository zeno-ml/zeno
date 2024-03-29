<script lang="ts">
	import { report, reports } from "../../../stores";
	import Beeswarm from "./chart-icons/BeeswarmIcon.svelte";
	import BarChart from "./chart-icons/BarChartIcon.svelte";
	import LineChart from "./chart-icons/LineChartIcon.svelte";
	import Table from "./chart-icons/TableIcon.svelte";
	import Radar from "./chart-icons/RadarChartIcon.svelte";
	import HeatMap from "./chart-icons/HeatMapIcon.svelte";

	import { ChartType } from "../../../zenoservice";

	const defaultMap = {
		barchart: {
			type: ChartType.BAR,
			xEncoding: "slices",
			yEncoding: "metrics",
			zEncoding: "models",
			fixedDimension: "y",
		},
		linechart: {
			type: ChartType.LINE,
			xEncoding: "slices",
			yEncoding: "metrics",
			zEncoding: "models",
			fixedDimension: "y",
		},
		table: {
			type: ChartType.TABLE,
			xEncoding: "models",
			yEncoding: "slices",
			zEncoding: "metrics",
			fixedDimension: "z",
		},
		beeswarm: {
			type: ChartType.BEESWARM,
			xEncoding: "metrics",
			yEncoding: "models",
			zEncoding: "slices",
			fixedDimension: "y",
		},
		radar: {
			type: ChartType.RADAR,
			xEncoding: "metrics",
			yEncoding: "slices",
			zEncoding: "models",
			fixedDimension: "z",
		},
		heatmap: {
			type: ChartType.HEATMAP,
			xEncoding: "slices",
			yEncoding: "models",
			zEncoding: "metrics",
			fixedDimension: "z",
		},
	};

	$: currentReport = $reports[$report];

	function updateChart(e) {
		if (e.currentTarget instanceof HTMLElement) {
			if ($reports[$report].type !== defaultMap[e.currentTarget.id].type) {
				currentReport.type = defaultMap[e.currentTarget.id].type;
				currentReport.parameters.xEncoding =
					defaultMap[e.currentTarget.id].xEncoding;
				currentReport.parameters.yEncoding =
					defaultMap[e.currentTarget.id].yEncoding;
				currentReport.parameters.zEncoding =
					defaultMap[e.currentTarget.id].zEncoding;
				currentReport.parameters.fixedDimension =
					defaultMap[e.currentTarget.id].fixedDimension;
				$reports[$report] = currentReport;
			}
		}
	}
</script>

<div class="chart-type">
	<h4 class="edit-title">Chart Type</h4>
	<div class="chart-flex">
		<div
			id="barchart"
			class="chart-element {$reports[$report].type === ChartType.BAR
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<BarChart />
			<h4 class="chart-title">Bar Chart</h4>
		</div>
		<div
			id="linechart"
			class="chart-element {$reports[$report].type === ChartType.LINE
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<LineChart />
			<h4 class="chart-title">Line Chart</h4>
		</div>
		<div
			id="table"
			class="chart-element {$reports[$report].type === ChartType.TABLE
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<Table />
			<h4 class="chart-title">Table</h4>
		</div>
		<div
			id="beeswarm"
			class="chart-element {$reports[$report].type === ChartType.BEESWARM
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<Beeswarm />
			<h4 class="chart-title">Beeswarm</h4>
		</div>
		<div
			id="radar"
			class="chart-element {$reports[$report].type === ChartType.RADAR
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<Radar />
			<h4 class="chart-title">Radar Chart</h4>
		</div>
		<div
			id="heatmap"
			class="chart-element {$reports[$report].type === ChartType.HEATMAP
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<HeatMap />
			<h4 class="chart-title">Heat Map</h4>
		</div>
	</div>
</div>

<style>
	.chart-type {
		margin-bottom: 20px;
	}
	.edit-title {
		border-bottom: 1px solid var(--G4);
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
		background: white;
		height: 60px;
		width: 90px;
		border-radius: 10px;
		align-items: center;
		padding: 10px;
		margin: 2px;
	}
	.chart-element:hover {
		cursor: pointer;
		background: var(--P3);
	}
	.selected {
		background: var(--P3);
	}
	.chart-title {
		margin: 5px 0px 0px 0px;
		font-weight: 500;
	}
</style>
