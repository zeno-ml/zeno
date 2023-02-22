<script lang="ts">
	import { reports } from "../../../stores";
	import Beeswarm from "./chart-icons/BeeswarmIcon.svelte";
	import BarChart from "./chart-icons/BarChartIcon.svelte";
	import LineChart from "./chart-icons/LineChartIcon.svelte";
	import TableView from "./chart-icons/TableViewIcon.svelte";

	export let reportId;
	$: currentReport = $reports[reportId];
</script>

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

<style>
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
</style>
