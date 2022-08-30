<script lang="ts">
	import { mdiPencilOutline } from "@mdi/js";
	import { Cell, Row } from "@smui/data-table";
	import { Svg } from "@smui/common/elements";
	import { Icon } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";

	import { getMetricsForSlices } from "../../util/util";
	import { models, slices, reports, report } from "../../stores";

	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";
	import SparkLine from "../SparkLine.svelte";

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
			return 1;
		});
		let rep = $reports[$report];
		rep.reportPredicates[predicateIndex].results = outcomes;
		reports.update((reps) => {
			reps[$report] = rep;
			return reps;
		});
	}
</script>

<Row style="overflow: visible">
	<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
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
							return reps;
						});
					}}>
					delete_outline
				</Icon>
			</div>
			{#if sli}
				<SliceDetailsContainer {sli} />
			{/if}
		</div>
	</Cell>
	<Cell style="overflow: visible">
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
	<Cell style="left: 100px">{predicate.transform}</Cell>
	<Cell>{predicate.metric}</Cell>
	{#if $models.length > 2 && modelResults.length > 0}
		<Cell class="end-cell"><SparkLine res={modelResults} /></Cell>
	{/if}
	{#each modelResults as r, i}
		<Cell>
			<p
				style={predicate.results[i] === undefined || predicate.results[i] === 1
					? "color: black"
					: "color: #b71c1c; font-weight: 500"}>
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
	:global(.sticky) {
		overflow: visible;
		left: 0px;
		background: white;
		z-index: 0;
	}
</style>
