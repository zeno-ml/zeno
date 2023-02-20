<script lang="ts">
	import {
		mdiBee,
		mdiChartBar,
		mdiChartLine,
		mdiPlus,
		mdiTable,
	} from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import { reports } from "../stores";
	import { clickOutside } from "../util/clickOutside";
	import { updateTab } from "../util/util";
	import ReportListRow from "./ReportListRow.svelte";

	let showNewReport = false;
</script>

<div id="reports-container">
	<div class="header">
		<h4>Reports</h4>
	</div>
	<div class="reports">
		{#each $reports as rep, i}
			<ReportListRow report={rep} reportIndex={i} />
		{/each}
		<div
			class="add-reports"
			on:click={() => (showNewReport = !showNewReport)}
			on:keydown={() => ({})}>
			<IconButton>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiPlus} />
				</Icon>
			</IconButton>
			{#if showNewReport}
				<div
					class="popup"
					use:clickOutside
					on:click_outside={() => (showNewReport = false)}>
					<Paper elevation={7}>
						<Content>
							<div
								class="report-entry"
								on:keydown={() => ({})}
								on:click={() => {
									reports.update((reps) => {
										reps.push({
											name: "new report",
											reportType: "table",
											reportPredicates: [],
										});

										let newIndex = reps.length - 1;
										updateTab("report/" + newIndex);

										return reps;
									});
								}}>
								<IconButton>
									<Icon component={Svg} viewBox="0 0 24 24">
										<path fill="black" d={mdiTable} />
									</Icon>
								</IconButton>
								<p>New <b>table</b> report</p>
							</div>
							<div
								class="report-entry"
								on:keydown={() => ({})}
								on:click={() => {
									reports.update((reps) => {
										reps.push({
											name: "new report",
											reportType: "slicechart",
											reportPredicates: [],
										});

										let newIndex = reps.length - 1;
										updateTab("report/" + newIndex);

										return reps;
									});
								}}>
								<IconButton>
									<Icon component={Svg} viewBox="0 0 24 24">
										<path fill="black" d={mdiChartBar} />
									</Icon>
								</IconButton>
								<p>New <b>slice chart</b> report</p>
							</div>
							<div
								class="report-entry"
								on:keydown={() => ({})}
								on:click={() => {
									reports.update((reps) => {
										reps.push({
											name: "new report",
											reportType: "timeseries",
											reportPredicates: [],
										});

										let newIndex = reps.length - 1;
										updateTab("report/" + newIndex);

										return reps;
									});
								}}>
								<IconButton>
									<Icon component={Svg} viewBox="0 0 24 24">
										<path fill="black" d={mdiChartLine} />
									</Icon>
								</IconButton>
								<p>New <b>timeseries</b> report</p>
							</div>
							<div
								class="report-entry"
								on:keydown={() => ({})}
								on:click={() => {
									reports.update((reps) => {
										reps.push({
											name: "new report",
											reportType: "beeswarm",
											reportPredicates: [],
										});

										let newIndex = reps.length - 1;
										updateTab("report/" + newIndex);

										return reps;
									});
								}}>
								<IconButton>
									<Icon component={Svg} viewBox="0 0 24 24">
										<path fill="black" d={mdiBee} />
									</Icon>
								</IconButton>
								<p>New <b>beeswarm chart</b> report</p>
							</div>
						</Content>
					</Paper>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	#reports-container {
		padding: 10px;
		margin-left: 10px;
		overflow-y: auto;
		height: calc(100vh - 80px);
	}
	.reports {
		display: flex;
		flex-wrap: wrap;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.add-reports {
		display: flex;
		justify-content: space-around;
		align-items: center;
		border: 1px solid var(--G4);
		border-radius: 4px;
		margin: 5px 5px 5px 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
		width: 150px;
		height: 150px;
	}
	.popup {
		position: absolute;
		z-index: 10;
		margin-top: 10px;
	}
	.report-entry {
		border: 1px solid var(--G5);
		transition: 0.25s;
		cursor: pointer;
		width: 300px;
		display: flex;
		align-items: center;
	}
	.report-entry:hover,
	.add-reports:hover {
		background: #f0ebf4;
	}
</style>
