<script lang="ts">
	import Button from "@smui/button";
	import Ripple from "@smui/ripple";

	import { report, reports } from "../stores";

	import ReportListRow from "./ReportListRow.svelte";

	report.set(-1);
</script>

<div id="reports-container">
	<div
		use:Ripple={{ surface: true, color: "primary" }}
		class={"overview " + ($report === -1 ? "selected" : "")}
		on:click={() => {
			report.set(-1);
		}}>
		<p>Overview</p>
	</div>
	<h4>Reports</h4>
	<div id="reports">
		{#each $reports as rep, i}
			<ReportListRow report={rep} reportIndex={i} />
		{/each}
	</div>
	<Button
		variant="outlined"
		on:click={() => {
			reports.update((reps) => {
				reps.push({
					name: "new report",
					reportPredicates: [],
				});
				return reps;
			});
		}}>New Report</Button>
</div>

<style>
	#reports-container {
		padding: 10px;
		margin-left: 10px;
		margin-right: 10px;
		overflow-y: auto;
		min-width: 450px;
		border-right: 1px solid #e8e8e8;
	}
	#reports {
		margin-bottom: 10px;
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
		border-bottom: 0.5px solid rgb(224, 224, 224);
		border-top: 0.5px solid rgb(224, 224, 224);
		padding-left: 10px;
		padding-right: 10px;
	}
	.selected {
		background: #f9f5ff;
	}
	.icon {
		width: 24px;
		height: 24px;
		margin-right: 10px;
	}
</style>
