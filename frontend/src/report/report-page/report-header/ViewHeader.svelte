<script lang="ts">
	import { mdiArrowCollapseLeft } from "@mdi/js";
	import { report, reports } from "../../../stores";
	import { updateTab } from "../../../util/util";
	import { Svg } from "@smui/common";
	import Button, { Label } from "@smui/button";
	export let isReportEdit;

	let ishover = false;
	let blur = function (ev) {
		ev.target.blur();
	};
	$: currentReport = $reports[$report];
</script>

<div class="header">
	<div
		class="return-link"
		on:keydown={() => ({})}
		on:click={() => {
			$reports[$report].name = currentReport.name;
			updateTab("report");
		}}
		on:focus={() => ({})}
		on:mouseover={() => {
			ishover = true;
		}}
		on:blur={() => ({})}
		on:mouseout={() => {
			ishover = false;
		}}>
		<Svg
			style="width: 24px; height: 24px; padding-right: 10px"
			viewBox="-2 -2 26 26">
			<path fill={ishover ? "black" : "var(--G2)"} d={mdiArrowCollapseLeft} />
		</Svg>
		<h4 style={ishover ? "color:black" : "color:var(--G2)"}>
			Back to Report Home
		</h4>
	</div>
	<div class="title-flex">
		<h2 style="margin:0px 20px 0px 0px; color: var(--G2)">
			{currentReport.name}
		</h2>
		<Button
			style="width: 24px; height: 24px;background-color:var(--G5)"
			on:mouseleave={blur}
			on:focusout={blur}
			on:click={() => (isReportEdit = !isReportEdit)}>
			<Label>{isReportEdit ? "View" : "Edit"}</Label>
		</Button>
	</div>
</div>

<style>
	.header {
		width: calc(50vw);
		display: flex;
		flex-direction: column;
		width: 353px;
		min-width: 353px;
		max-width: 353px;
		padding-top: 10px;
		padding-bottom: 0px;
		padding-left: 15px;
		padding-right: 15px;
	}

	.return-link {
		display: flex;
		align-items: center;
		cursor: pointer;
		width: fit-content;
		margin-bottom: 5px;
	}
	.title-flex {
		display: flex;
		align-items: center;
	}
</style>
