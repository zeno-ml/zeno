<script lang="ts">
	import { Svg } from "@smui/common/elements";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiPlus } from "@mdi/js";
	import Ripple from "@smui/ripple";

	import { report, reports } from "../stores";

	import ReportListRow from "./ReportListRow.svelte";

	report.set(-1);
</script>

<div id="reports-container">
	<div class="header">
		<h4>Reports</h4>
		<div
			on:click={() => {
				reports.update((reps) => {
					reps.push({
						name: "new report",
						reportPredicates: [],
					});
					return reps;
				});
			}}>
			<IconButton>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiPlus} />
				</Icon>
			</IconButton>
		</div>
	</div>
	<div id="reports">
		<div
			use:Ripple={{ surface: true, color: "primary" }}
			class={"overview " + ($report === -1 ? "selected" : "")}
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
		min-width: 450px;
		width: 450px;
		height: calc(100vh - 80px);
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
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
