<script lang="ts">
	import { mdiPencilOutline } from "@mdi/js";
	import { Cell, Row } from "@smui/data-table";
	import { Svg } from "@smui/common/elements";
	import { Icon } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";

	import { getMetricsForSlices, updateReports } from "../../util";
	import { models, slices, reports, report } from "../../stores";

	import SliceCell from "../SliceCell.svelte";

	export let predicateIndex: number;
	export let predicate: ReportPredicate;

	let editMode = false;

	$: sli = $slices.get(predicate.sliceName);

	$: modelResults = getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			metric: predicate.metric,
			model: m,
			transform: predicate.transform,
		}))
	);

	function getTestResult(res: number) {
		if (!predicate.operation || !predicate.value) {
			return true;
		} else if (!eval(`${res} ${predicate.operation} ${predicate.value}`)) {
			return false;
		} else {
			return true;
		}
	}
</script>

<Row>
	<Cell>
		<div class="inline">
			<div style:width="24px" style:height="24" style:cursor="pointer">
				<Icon
					component={Svg}
					viewBox="0 0 24 24"
					on:click={(e) => {
						e.stopPropagation();
						editMode = !editMode;
					}}>
					<path fill="black" d={mdiPencilOutline} />
				</Icon>
			</div>
			<div
				style:width="24px"
				style:height="24px"
				style:cursor="pointer"
				style:margin-right="10px">
				<Icon
					viewBox="0 0 24 24"
					class="material-icons"
					on:click={(e) => {
						e.stopPropagation();
						let rep = $reports[$report];
						rep.reportPredicates.splice(predicateIndex, 1);
						reports.update((reps) => {
							reps[$report] = rep;
							updateReports(reps);
							return reps;
						});
					}}>
					delete_outline
				</Icon>
			</div>
			<SliceCell {sli} />
		</div>
	</Cell>
	{#if editMode}
		<Select
			bind:value={predicate.operation}
			label="Operation"
			style="margin-right: 20px; margin-left: 20px; width: 120px">
			{#each [">", "<", "==", "!="] as o}
				<Option value={o}>{o}</Option>
			{/each}
		</Select>
		<Textfield style="width: 50px" bind:value={predicate.value} label="Value">
			<HelperText slot="helper">0</HelperText>
		</Textfield>
	{:else}
		<Cell>{predicate.operation} {predicate.value}</Cell>
	{/if}
	<Cell>{predicate.transform}</Cell>
	<Cell>{predicate.metric}</Cell>
	{#await modelResults then results}
		{#each results as r}
			<Cell>
				<p style:color={getTestResult(r) ? "black" : "red"}>
					{r ? r.toFixed(2) : ""}
				</p>
			</Cell>
		{/each}
	{/await}
</Row>

<style>
	.inline {
		display: flex;
		align-items: center;
	}
</style>
