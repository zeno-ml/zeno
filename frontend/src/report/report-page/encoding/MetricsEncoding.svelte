<script lang="ts">
	import { ready, report, reports, metrics } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import { ChartType } from "../../../zenoservice";
</script>

{#if $ready}
	<div class="parameters">
		<h4 class="select-label">
			{$reports[$report].type !== ChartType.TABLE ? "" : "metrics"}
		</h4>
		<Select
			bind:value={$reports[$report].metrics}
			class="select"
			variant="outlined">
			{#each $metrics as m}
				<Option value={m}>{m}</Option>
			{/each}
		</Select>
	</div>
{/if}

<style>
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 260px;
	}
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.select-label {
		margin: 5px;
	}
</style>
