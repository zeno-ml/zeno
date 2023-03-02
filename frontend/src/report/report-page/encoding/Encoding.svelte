<script lang="ts">
	import {
		ready,
		report,
		reports,
		metric,
		metrics,
		models,
	} from "../../../stores";
	import Select, { Option } from "@smui/select";
	import Checkbox from "@smui/checkbox";
	import FormField from "@smui/form-field";
	import { TrailingIcon } from "@smui/chips";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import { mdiPlusBoxOutline } from "@mdi/js";
	import { clickOutside } from "../../../util/clickOutside";
	import SliceTable from "../../slice-table-report/SliceTable.svelte";
	$: color = "model";
	let selectedModel = [...$models];
	$: showSlices = false;

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
				<div
					on:click={() => (showSlices = !showSlices)}
					on:keydown={() => ({})}>
					<IconButton>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="var(--P2)" d={mdiPlusBoxOutline} />
						</Icon>
					</IconButton>
				</div>
				{#if showSlices}
					<div
						class="popup"
						use:clickOutside
						on:click_outside={() => (showSlices = false)}>
						<Paper elevation={7}>
							<Content>
								<div id="slices">
									<div class="settings">
										{#if $metrics}
											<Select
												bind:value={$metric}
												label="Metric"
												style="margin-right: 20px;">
												{#each $metrics as m}
													<Option value={m}>{m}</Option>
												{/each}
											</Select>
										{/if}
									</div>
									<SliceTable />
								</div>
							</Content>
						</Paper>
					</div>
				{/if}
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

			<div class="parameters">
				<h4 class="select-label">color</h4>
				<Select bind:value={color} class="select" variant="outlined">
					<Option value={"model"}>Model</Option>
					<Option value={"slice"}>Slice</Option>
				</Select>
			</div>
			{#if color === "model"}
				<div class="models">
					{#each $models as m}
						<FormField>
							<Checkbox bind:group={selectedModel} value={m} />
							<span slot="label">{m}</span>
						</FormField>
					{/each}
				</div>
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
	.popup {
		position: fixed;
		top: 20vh;
		left: 25vw;
		z-index: 10;
	}
	#slices {
		padding: 20px;
		border-top: 1px solid var(--G5);
		background: var(--Y2);
		max-height: 45vh;
		overflow-y: scroll;
	}
	.settings {
		margin-bottom: 10px;
	}
</style>
