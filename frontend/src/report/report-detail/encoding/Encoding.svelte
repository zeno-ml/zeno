<script lang="ts">
	import { ready, report, reports } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import { TrailingIcon } from "@smui/chips";
	$: rep = $reports[$report];
</script>

{#if $ready}
	<div id="encoding">
		<h4>Encoding</h4>
		<div id="encoding-flex">
			<div class="parameters">
				<h4 class="select-label">x</h4>
				<Select value="slice" class="select" variant="outlined">
					<Option value={"slice"}>slice</Option>
					<Option value={"model"}>model</Option>
				</Select>
			</div>
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
			<div class="parameters">
				<h4 class="select-label">y</h4>
				<Select value="accuracy" class="select" variant="outlined">
					<Option value={"accuracy"}>accuracy</Option>
				</Select>
			</div>
			<div class="parameters">
				<h4 class="select-label">color</h4>
				<Select class="select" variant="outlined">
					<Option value={"color"}>color</Option>
				</Select>
			</div>
			<div class="parameters">
				<h4 class="select-label">size</h4>
				<Select class="select" variant="outlined">
					<Option value={"size"}>size</Option>
				</Select>
			</div>
		</div>
	</div>
{/if}

<style>
	#encoding {
		margin-bottom: 20px;
	}
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 280px;
		align-items: right;
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
