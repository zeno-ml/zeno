<script lang="ts">
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { slide } from "svelte/transition";
	import ReportsList from "./report/ReportsList.svelte";
	import SliceChartReport from "./report/slice-chart/SliceChartReport.svelte";
	import SliceTable from "./report/slice-table-report/SliceTable.svelte";
	import TableReportTable from "./report/table-report/TableReportTable.svelte";
	import TimeseriesReportTable from "./report/timeseries-report/TimeseriesReportTable.svelte";
	import { metric, metrics, ready, report, reports } from "./stores";

	let showSlices = true;

	$: currentReport = $reports[$report];
</script>

<main>
	{#if $ready}
		<ReportsList />
		<div id="report-panel">
			<div id="reports">
				{#if currentReport}
					{#if currentReport.reportType === "timeseries"}
						<TimeseriesReportTable reportId={$report} />
					{:else if currentReport.reportType === "slicechart"}
						<SliceChartReport reportId={$report} />
					{:else}
						<TableReportTable reportId={$report} />
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
					<div id="slices" in:slide out:slide>
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
		width: calc(100% - 470px);
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
