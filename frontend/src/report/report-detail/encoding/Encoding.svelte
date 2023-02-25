<script lang="ts">
	import { ready, report, reports, metric, metrics } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import { TrailingIcon } from "@smui/chips";

	$: rep = $reports[$report];
	$: x_axis = "slice";
	$: y_axis = "metric";
</script>

{#if $ready}
	<div id="encoding">
		<h4 class="edit-type">Encoding</h4>
		<div id="encoding-flex">
			<div class="parameters">
				<h4 class="select-label">x</h4>
				<Select bind:value={x_axis} class="select" variant="outlined">
					<Option value={"slice"}>Slice</Option>
					<Option value={"model"}>Model</Option>
				</Select>
			</div>
			{#if x_axis === "slice"}
				<div class="chips">
					{#each rep.reportPredicates as predicate, i}
						<div class="slice-chip">
							{predicate.sliceName}
							<TrailingIcon
								class="remove material-icons"
								on:click={() => {
									rep.reportPredicates.splice(i, 1);
									reports.update((reps) => {
										reps[$report] = rep;
										return reps;
									});
								}}>
								cancel
							</TrailingIcon>
						</div>
					{/each}
				</div>
			{/if}
			<div class="parameters">
				<h4 class="select-label">y</h4>
				<Select bind:value={y_axis} class="select" variant="outlined">
					<Option value={"metric"}>Metric</Option>
				</Select>
			</div>
			{#if y_axis === "metric"}
				{#if y_axis === "metric" && $metrics && $metrics.length > 0}
					<div class="parameters">
						<h4 class="select-label">&nbsp;</h4>
						<Select bind:value={$metric} class="select" variant="outlined">
							{#each $metrics as m}
								<Option value={m}>{m}</Option>
							{/each}
						</Select>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 280px;
	}
	.edit-type {
		border-bottom: 1px solid var(--G4);
	}
	#encoding {
		margin-bottom: 20px;
	}
	#encoding-flex {
		display: flex;
		flex-direction: column;
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
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	.slice-chip {
		padding: 5px 10px;
		background: var(--P3);
		margin: 5px;
		border-radius: 10px;
	}
</style>
