<script lang="ts">
	import { mdiArrowCollapseLeft } from "@mdi/js";
	import { report, reports } from "../../../stores";
	import { updateTab } from "../../../util/util";
	import { Svg } from "@smui/common";
	import Textfield from "@smui/textfield";
	import Button, { Label } from "@smui/button";
	export let isReportEdit;

	let ishover = false;
	let blur = function (ev) {
		ev.target.blur();
	};
	$: currentReport = $reports[$report];
</script>

<div class="header-flex">
	<div class="top-flex">
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
		<Button
			style="width: 24px; height: 24px;margin-bottom:3px;background-color:var(--G5)"
			on:mouseleave={blur}
			on:focusout={blur}
			on:click={() => (isReportEdit = !isReportEdit)}>
			<Label>{isReportEdit ? "View" : "Edit"}</Label>
		</Button>
	</div>
	<div class="report-name">
		<Textfield
			style="width: -webkit-fill-available"
			variant="outlined"
			bind:value={currentReport.name}
			label="Report Name" />
	</div>
</div>

<style>
	.header-flex {
		display: flex;
		flex-direction: column;
	}
	.top-flex {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.return-link {
		display: flex;
		align-items: center;
		cursor: pointer;
		width: fit-content;
		margin-bottom: 5px;
	}
</style>
