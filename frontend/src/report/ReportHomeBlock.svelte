<script lang="ts">
	import {
		mdiBee,
		mdiChartBar,
		mdiChartLine,
		mdiTable,
		mdiDotsVertical,
		mdiRadar,
		mdiViewGrid,
	} from "@mdi/js";

	import { Icon } from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import { reports } from "../stores";
	import { updateTab } from "../util/util";
	import { clickOutside } from "../util/clickOutside";
	import { ChartType } from "../zenoservice";

	export let report;
	export let reportIndex;

	let showOptions = false;
	let iconMap = {
		[ChartType.TABLE]: mdiTable,
		[ChartType.LINE]: mdiChartLine,
		[ChartType.BAR]: mdiChartBar,
		[ChartType.BEESWARM]: mdiBee,
		[ChartType.RADAR]: mdiRadar,
		[ChartType.HEATMAP]: mdiViewGrid,
	};
</script>

<div
	class="report"
	on:click={() => updateTab("report/" + reportIndex)}
	on:keydown={() => ({})}>
	<div class="inline">
		<div class="report-type">
			<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={iconMap[report.type]} />
			</Icon>
		</div>
		<p class="report-name">{report.name}</p>
		<div>
			<IconButton
				on:click={(e) => {
					e.stopPropagation();
					showOptions = !showOptions;
				}}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiDotsVertical} />
				</Icon>
			</IconButton>
			{#if showOptions}
				<div
					id="options-container"
					use:clickOutside
					on:click_outside={() => (showOptions = !showOptions)}>
					<Paper style="padding: 7px 0px 7px 0px;" elevation={7}>
						<Content>
							<div
								class="option"
								on:keydown={() => ({})}
								on:click={(e) => {
									e.stopPropagation();
									showOptions = false;
									reports.update((reps) => {
										reps.splice(reportIndex, 1);
										return reps;
									});
								}}>
								<Icon style="font-size: 20px;" class="material-icons"
									>delete_outline</Icon
								>&nbsp;
								<span>Remove</span>
							</div>
							<div
								class="option"
								on:keydown={() => ({})}
								on:click={(e) => {
									e.stopPropagation();
									showOptions = false;
									reports.update((reps) => {
										reps.push({
											name: "Copy of " + report.name,
											type: report.type,
											slices: report.slices,
											models: report.models,
											metrics: report.metrics,
											parameters: report.parameters,
											fixedDimension: report.fixedDimension,
										});
										return reps;
									});
								}}>
								<Icon style="font-size: 20px;" class="material-icons"
									>content_copy</Icon
								>&nbsp;
								<span>Make a copy</span>
							</div>
						</Content>
					</Paper>
				</div>
			{/if}
		</div>
	</div>
	<p class="report-slice">
		{report.slices ? report.slices.length : 0} slices,
		{report.models ? report.models.length : 0} models,
		{report.metrics ? report.metrics.length : 0} metrics
	</p>
</div>

<style>
	.report {
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid var(--G4);
		border-radius: 10px;
		margin: 5px 5px 5px 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
		width: 250px;
		height: 100px;
	}
	.report:hover {
		background: var(--P3);
	}
	.inline {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
	.report-type {
		width: 24px;
		height: 24px;
		margin: 14px;
	}
	.report-name {
		font-size: 16px;
		color: black;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
		white-space: nowrap;
	}
	.report-slice {
		margin: 3px;
	}
	#options-container {
		z-index: 5;
		margin-top: -7px;
		margin-left: 20px;
		position: absolute;
	}
	.option {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
		width: 110px;
		padding: 2px 10px 2px 10px;
	}
	.option span {
		font-size: 13px;
	}
	.option:hover {
		background: var(--G5);
	}
</style>
