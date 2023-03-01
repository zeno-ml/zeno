<script lang="ts">
	import { ready, report, reports } from "../../../stores";
	import Beeswarm from "./chart-icons/BeeswarmIcon.svelte";
	import BarChart from "./chart-icons/BarChartIcon.svelte";
	import LineChart from "./chart-icons/LineChartIcon.svelte";
	import TableView from "./chart-icons/TableViewIcon.svelte";
	import { ReportType } from "../../../zenoservice";

	$: selectedchart = $reports[$report].reportType;
	let idMap = {
		barchart: ReportType.BARCHART,
		linechart: ReportType.LINECHART,
		table: ReportType.TABLEVIEW,
		beeswarm: ReportType.BEESWARM,
	};
	function updateChartType(e) {
		if (e.currentTarget instanceof HTMLElement) {
			$reports[$report].reportType = idMap[e.currentTarget.id];
		}
	}
</script>

{#if $ready}
	<div class="chart-type">
		<h4 class="edit-title">Chart Type</h4>
		<div class="chart-flex">
			<div
				id="barchart"
				class="chart-element {selectedchart === ReportType.BARCHART
					? 'selected'
					: ''}"
				on:keydown={() => ({})}
				on:click={updateChartType}>
				<BarChart />
				<h4 class="chart-title">Bar Chart</h4>
			</div>
			<div
				id="linechart"
				class="chart-element {selectedchart === ReportType.LINECHART
					? 'selected'
					: ''}"
				on:keydown={() => ({})}
				on:click={updateChartType}>
				<LineChart />
				<h4 class="chart-title">Line Chart</h4>
			</div>
			<div
				id="table"
				class="chart-element {selectedchart === ReportType.TABLEVIEW
					? 'selected'
					: ''}"
				on:keydown={() => ({})}
				on:click={updateChartType}>
				<TableView />
				<h4 class="chart-title">Table View</h4>
			</div>
			<div
				id="beeswarm"
				class="chart-element {selectedchart === ReportType.BEESWARM
					? 'selected'
					: ''}"
				on:keydown={() => ({})}
				on:click={updateChartType}>
				<Beeswarm />
				<h4 class="chart-title">Beeswarm Plot</h4>
			</div>
		</div>
	</div>
{/if}

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
	.selected {
		background: var(--P3);
	}
	.chart-title {
		margin: 5px 0px 0px 0px;
	}
</style>
