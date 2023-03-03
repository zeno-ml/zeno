<script lang="ts">
	import { ready, report, reports, metrics } from "../../../stores";
	import Select, { Option } from "@smui/select";
	$: currentReport = $reports[$report];
</script>

{#if ready}
	<div class="parameters">
		<h4 class="select-label">&nbsp;</h4>
		<Select
			bind:value={currentReport.metrics}
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
		width: 280px;
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
