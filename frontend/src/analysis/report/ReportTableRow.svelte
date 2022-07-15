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

	let modelResults = [];
	$: getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			metric: predicate.metric,
			model: m,
			transform: predicate.transform,
		}))
	).then((arr) => (modelResults = arr));

	function savePredicates() {
		// Exiting edit mode, save predicates and update results.
		let outcomes = modelResults.map((res) => {
			if (predicate.operation && predicate.value) {
				if (eval(`${res} ${predicate.operation} ${predicate.value}`)) {
					return 1;
				} else {
					return 0;
				}
			}
			return -1;
		});
		let rep = $reports[$report];
		rep.reportPredicates[predicateIndex].results = outcomes;
		reports.update((reps) => {
			reps[$report] = rep;
			updateReports(reps);
			return reps;
		});
	}
</script>

<Row style="overflow: visible">
	<Cell>
		<div class="inline">
			<div style:width="24px" style:height="24" style:cursor="pointer">
				<Icon
					component={Svg}
					viewBox="0 0 24 24"
					on:click={(e) => {
						e.stopPropagation();
						if (editMode) {
							savePredicates();
						}
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
	<Cell>{predicate.transform}</Cell>
	<Cell>{predicate.metric}</Cell>
	<Cell style="overflow: visible" class="end-cell">
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
			{predicate.operation} {predicate.value}
		{/if}
	</Cell>
	{#each modelResults.slice().reverse() as r, i}
		<Cell>
			<p
				style:color={predicate.results.length > i &&
				predicate.results[predicate.results.length - i - 1] === 0
					? "red"
					: "black"}>
				{r ? r.toFixed(2) : ""}
			</p>
		</Cell>
	{/each}
</Row>

<style>
	.inline {
		display: flex;
		align-items: center;
	}
</style>
