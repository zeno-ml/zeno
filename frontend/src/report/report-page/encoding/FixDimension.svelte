<script lang="ts">
	import { mdiInformationOutline } from "@mdi/js";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { Svg } from "@smui/common";
	import { Icon } from "@smui/icon-button";
	import { report, reports } from "../../../stores";

	export let value;
</script>

<div class="fix-dimension-flex">
	<label>
		<input
			type="radio"
			bind:group={$reports[$report].parameters.fixedDimension}
			name="fixed_dimension"
			{value} />
		<span>Fix this dimension</span>
	</label>
	<div
		class="information-tooltip"
		use:tooltip={{
			content:
				"Change this dimension to only allow choosing one option instead of many.",
			theme: "zeno-tooltip",
			autoPosition: true,
		}}>
		<Icon style="outline:none" component={Svg} viewBox="-6 -10 42 42">
			<path d={mdiInformationOutline} />
		</Icon>
	</div>
</div>

<style>
	.fix-dimension-flex {
		display: flex;
		flex-direction: row;
	}
	.fix-dimension-flex label {
		padding-left: 59px;
	}
	.fix-dimension-flex input {
		vertical-align: middle;
		margin-bottom: 1px;
		margin-right: 1px;
	}
	.fix-dimension-flex label span {
		vertical-align: middle;
	}
	.information-tooltip {
		width: 24px;
		height: 24px;
		cursor: help;
		fill: var(--G2);
	}
</style>
