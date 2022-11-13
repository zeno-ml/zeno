<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import { Icon } from "@smui/button";
	import IconButton from "@smui/icon-button";

	import { getMetricsForSlices } from "../../api";
	import { models, slices, reports, report } from "../../stores";

	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";
	import SparkLine from "../SparkLine.svelte";

	export let predicateIndex: number;
	export let predicate: ReportPredicate;

	$: sli = $slices.get(predicate.sliceName);

	let modelResults = [];
	$: getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			state: {
				metric: predicate.metric,
				model: m,
				transform: predicate.transform,
			},
		}))
	).then((arr) => (modelResults = arr));
</script>

<Row style="overflow: visible">
	<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
		<div class="inline">
			{#if sli}
				<SliceDetailsContainer {sli} />
			{/if}
			<div class="group">
				<IconButton
					on:click={(e) => {
						e.stopPropagation();
						let rep = $reports[$report];
						rep.reportPredicates.splice(predicateIndex, 1);
						reports.update((reps) => {
							reps[$report] = rep;
							return reps;
						});
					}}>
					<Icon class="material-icons">delete_outline</Icon>
				</IconButton>
			</div>
		</div>
	</Cell>
	<Cell style="left: 100px">{predicate.transform}</Cell>
	<Cell>{predicate.metric}</Cell>
	{#if $models.length > 2 && modelResults.length > 0}
		<Cell class="end-cell"><SparkLine res={modelResults} /></Cell>
	{/if}
	{#each modelResults as r, i}
		<Cell>
			<p>
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
	.group {
		margin-left: 10px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
</style>
