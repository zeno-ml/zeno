<script lang="ts">
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { slide } from "svelte/transition";
	import { metric, metrics, ready, report, reports } from "../../stores";
	import BeeswarmChartReport from "../beeswarm-chart/BeeswarmChartReport.svelte";
	import ReportHeader from "./report-header/ReportHeader.svelte";
	import SliceChartReport from "../slice-chart/SliceChartReport.svelte";
	import SliceTable from "../slice-table-report/SliceTable.svelte";
	import TableReportTable from "../table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "../timeseries-report/TimeseriesReportTable.svelte";

	export let params;

	let showSlices = true;

	$: report.set(params.id);
	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<div id="report-panel">
			<ReportHeader />
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
			<div id="slice-container">
				<div id="slice-show">
					<IconButton
						ripple={false}
						on:click={() => (showSlices = !showSlices)}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path
								fill="black"
								d={showSlices ? mdiChevronDown : mdiChevronUp} />
						</Icon>
					</IconButton>
				</div>
				{#if showSlices}
					<div id="slices" in:slide>
						<div class="settings">
							{#if $metrics}
								<Select
									bind:value={$metric}
									label="Metric"
									style="margin-right: 20px;">
									{#each $metrics as m}
										<Option value={m}>{m}</Option>
									{/each}
								</Select>
							{/if}
						</div>
						<SliceTable />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 80px);
	}
	#slice-container {
		position: absolute;
		width: calc(100% - 80px);
		bottom: 0;
	}
	#slices {
		padding: 20px;
		border-top: 1px solid var(--G5);
		background: var(--Y2);
		max-height: 300px;
		min-height: 300px;
		overflow-y: scroll;
	}
	#reports {
		display: flex;
		flex-direction: column;
	}
	#report-panel {
		width: 100%;
	}
	.settings {
		margin-bottom: 10px;
	}
	#slice-show {
		background: var(--P3);
		width: fit-content;
		border-top-right-radius: 5px;
		border-top-left-radius: 5px;
	}
</style>
