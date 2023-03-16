<script lang="ts">
	import { report, reports } from "../../../stores";
	import Beeswarm from "./chart-icons/BeeswarmIcon.svelte";
	import BarChart from "./chart-icons/BarChartIcon.svelte";
	import LineChart from "./chart-icons/LineChartIcon.svelte";
	import TableView from "./chart-icons/TableViewIcon.svelte";
	import { ChartType } from "../../../zenoservice";

	const defaultMap = {
		barchart: {
			name: "Bar Chart Report",
			type: ChartType.BAR,
			xEncoding: "slices",
			yEncoding: "metrics",
			colorEncoding: "models",
		},
		table: {
			name: "Table View Report",
			type: ChartType.TABLE,
			xEncoding: "models",
			yEncoding: "slices",
			colorEncoding: "metrics",
		},
		linechart: {
			name: "Line Chart Report",
			type: ChartType.LINE,
			xEncoding: "slices",
			yEncoding: "metrics",
			colorEncoding: "models",
		},
		beeswarm: {
			name: "Beeswarm Plot Report",
			type: ChartType.BEESWARM,
			xEncoding: "metrics",
			yEncoding: "models",
			colorEncoding: "slices",
		},
	};

	$: currentReport = $reports[$report];

	function updateChart(e) {
		if (e.currentTarget instanceof HTMLElement) {
			let newType = $reports[$report].type;
			let oldType = defaultMap[e.currentTarget.id].type;
			if (newType !== oldType) {
				currentReport.name = defaultMap[e.currentTarget.id].name;
				currentReport.type = defaultMap[e.currentTarget.id].type;
				currentReport.parameters.xEncoding =
					defaultMap[e.currentTarget.id].xEncoding;
				currentReport.parameters.yEncoding =
					defaultMap[e.currentTarget.id].yEncoding;
				currentReport.parameters.colorEncoding =
					defaultMap[e.currentTarget.id].colorEncoding;
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
			<TableView />
			<h4 class="chart-title">Table View</h4>
		</div>
		<div
			id="beeswarm"
			class="chart-element {$reports[$report].type === ChartType.BEESWARM
				? 'selected'
				: ''}"
			on:keydown={() => ({})}
			on:click={updateChart}>
			<Beeswarm />
			<h4 class="chart-title">Beeswarm Plot</h4>
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
		height: 60px;
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
	.selected {
		background: var(--P3);
	}
	.chart-title {
		margin: 5px 0px 0px 0px;
	}
</style>
