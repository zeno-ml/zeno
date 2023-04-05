<script lang="ts">
	import { mdiPlus } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { reports, slices, models, metrics } from "../stores";
	import { updateTab } from "../util/util";
	import ReportHomeBlock from "./ReportHomeBlock.svelte";
	import { ChartType } from "../zenoservice";
</script>

<div id="reports-container">
	<div class="header">
		<h3>Reports</h3>
	</div>
	<div class="reports">
		{#each $reports as rep, i}
			<ReportHomeBlock report={rep} reportIndex={i} />
		{/each}
		<div
			class="add-reports"
			on:click={(e) => {
				e.stopPropagation();
				reports.update((reps) => {
					updateTab("report/" + reps.length);
					reps.push({
						name: "New Report",
						type: ChartType.BAR,
						slices: [...$slices.values()],
						models: [...$models.values()],
						metrics: [...$metrics.values(), "size"],
						parameters: {
							xEncoding: "slices",
							yEncoding: "metrics",
							colorEncoding: "models",
							fixedDimension: "y",
							secondSlices: [],
						},
					});
					return reps;
				});
			}}
			on:keydown={() => ({})}>
			<IconButton>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiPlus} />
				</Icon>
			</IconButton>
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
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		border: 1px solid var(--G4);
		border-radius: 10px;
		margin: 5px 5px 5px 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
		width: 225px;
		height: 100px;
	}
	.add-reports:hover {
		background: #f0ebf4;
	}
</style>
