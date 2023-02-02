<script lang="ts">
	import { Icon } from "@smui/button";
	import { Cell, Row } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import { getMetricsForSlices } from "../../api/slice";
	import { models, report, reports, slices } from "../../stores";
	import type { ReportPredicate } from "../../zenoservice";
	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";

	export let predicateIndex: number;
	export let predicate: ReportPredicate;

	let modelResults = [];

	$: sli = $slices.get(predicate.sliceName);
	$: getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			metric: predicate.metric,
			model: m,
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
	<Cell>{predicate.metric}</Cell>
	{#each modelResults as r}
		<Cell>
			<p>
				{r.metric.toFixed(2)}
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
		background: var(--G6);
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
