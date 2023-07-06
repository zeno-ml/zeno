<script lang="ts">
	import {
		mdiBee,
		mdiChartBar,
		mdiChartLine,
		mdiRadar,
		mdiTable,
		mdiViewGrid,
	} from "@mdi/js";
	import IconButton, { Icon } from "@smui/icon-button";
	import Button from "@smui/button";
	import { Row, Cell } from "@smui/data-table";
	import { Svg } from "@smui/common";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { reports } from "../stores";
	import { ChartType } from "../zenoservice";
	import { updateTab } from "../util/util";

	export let report;

	let iconMap = {
		[ChartType.TABLE]: mdiTable,
		[ChartType.LINE]: mdiChartLine,
		[ChartType.BAR]: mdiChartBar,
		[ChartType.BEESWARM]: mdiBee,
		[ChartType.RADAR]: mdiRadar,
		[ChartType.HEATMAP]: mdiViewGrid,
	};

	let blur = function (ev) {
		ev.target.blur();
	};
</script>

<Row>
	<Cell>
		<div class="report-type">
			<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={iconMap[report.type]} />
			</Icon>
		</div>
	</Cell>
	<Cell>
		<div class="inline">
			<p class="report-name">{report.name}</p>
			<Button
				style="background-color: white; height: 25px"
				variant="outlined"
				on:click={() => updateTab("report/" + report.id)}>
				View
			</Button>
		</div>
	</Cell>
	<Cell>
		<div class="report-slice">
			{report.slices ? report.slices.length : 0}
		</div>
	</Cell>
	<Cell>
		<div class="report-slice">
			{report.models ? report.models.length : 0}
		</div>
	</Cell>
	<Cell>
		<div class="report-slice">
			{report.metrics ? report.metrics.length : 0}
		</div>
	</Cell>
	<Cell>
		<div class="report-slice">
			<p>{report.createdAt}</p>
		</div>
	</Cell>
	<Cell style="overflow:visible">
		<div class="inline">
			<div
				use:tooltip={{
					content: "Make a copy",
					position: "left",
					theme: "zeno-tooltip",
				}}>
				<IconButton
					on:click={() => {
						reports.update((reps) => {
							reps.push({
								id: reps.length,
								name: "Copy of " + report.name,
								type: report.type,
								slices: report.slices,
								models: report.models,
								metrics: report.metrics,
								parameters: report.parameters,
								createdAt: new Date().toLocaleString(),
							});
							return reps;
						});
					}}
					on:mouseleave={blur}
					on:focusout={blur}>
					<Icon style="font-size: 20px;" class="material-icons">
						content_copy
					</Icon>
				</IconButton>
			</div>
			<div
				use:tooltip={{
					content: "Remove",
					position: "left",
					theme: "zeno-tooltip",
				}}>
				<IconButton
					on:click={() => {
						reports.update((reps) => {
							let reportIndex = $reports.findIndex(
								(rep) => rep.id === report.id
							);
							reps.splice(reportIndex, 1);
							reps.map((rep, i) => (rep.id = i));
							return reps;
						});
					}}
					on:mouseleave={blur}
					on:focusout={blur}>
					<Icon style="font-size: 21px;" class="material-icons">
						delete_outline
					</Icon>
				</IconButton>
			</div>
		</div>
	</Cell>
</Row>

<style>
	.inline {
		display: flex;
		align-items: center;
	}
	.report-type {
		width: 24px;
		height: 24px;
		margin: 4px;
	}
	.report-name {
		font-size: 14px;
		color: black;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: 100%;
		white-space: nowrap;
		margin-right: 10px;
	}
	.report-slice {
		margin: 3px;
		display: flex;
		justify-content: center;
	}
</style>