<script lang="ts">
	import {
		mdiChartBar,
		mdiChartLine,
		mdiPlus,
		mdiTable,
		mdiBee,
	} from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import Ripple from "@smui/ripple";
	import { report, reports } from "../stores";
	import { clickOutside } from "../util/clickOutside";
	import ReportListRow from "./ReportListRow.svelte";
	import { updateTab } from "../util/util";

	report.set(-1);

	let showNewReport = false;
</script>

<div id="reports-container">
	<div class="header">
		<h4>Reports</h4>
		<div
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
										return reps;
									});
								}}>
								<IconButton>
									<Icon component={Svg} viewBox="0 0 24 24">
										<path fill="black" d={mdiBee} />
									</Icon>
								</IconButton>
								<p>New <b>Beeswarm chart</b> report</p>
							</div>
						</Content>
					</Paper>
				</div>
			{/if}
		</div>
	</div>
	<div id="reports">
		<div
			use:Ripple={{ surface: true, color: "primary" }}
			class={"overview " + ($report === -1 ? "selected" : "")}
			on:keydown={() => ({})}
			on:click={() => {
				report.set(-1);
			}}>
			<p>Overview</p>
		</div>
		{#each $reports as rep, i}
			<ReportListRow report={rep} reportIndex={i} />
		{/each}
	</div>
</div>

<style>
	#reports-container {
		padding: 10px;
		margin-left: 10px;
		overflow-y: auto;
		min-width: 400px;
		width: 400px;
		height: calc(100vh - 80px);
		border-right: 1px solid #e8e8e8;
	}
	.report {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 0.5px solid rgb(224, 224, 224);
		border-top: 0.5px solid rgb(224, 224, 224);
		padding-left: 10px;
		padding-right: 10px;
	}
	.overview {
		display: flex;
		align-items: center;
		border: 1px solid var(--G5);
		border-radius: 4px;
		margin-top: 5px;
		margin-bottom: 5px;
		padding-left: 10px;
		padding-right: 10px;
		cursor: pointer;
	}
	.selected {
		background: var(--P3);
	}
	.icon {
		width: 24px;
		height: 24px;
		margin-right: 10px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.popup {
		position: absolute;
		z-index: 10;
		margin-top: 10px;
		background: var(--G6);
	}
	.report-entry {
		border: 1px solid var(--G5);
		transition: 0.25s;
		cursor: pointer;
		width: 300px;
		display: flex;
		align-items: center;
	}
	.report-entry:hover {
		background: var(--P3);
	}
</style>
