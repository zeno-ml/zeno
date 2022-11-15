<script lang="ts">
	import { mdiPlusCircleOutline } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common";
	import { Cell, Row } from "@smui/data-table";

	import { metric, models, report, reports, transform } from "../../stores";
	import { getMetricsForSlices } from "../../api";

	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";

	export let sli: Slice;

	$: modelResults = getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			state: {
				metric: $metric,
				model: m,
				transform: $transform,
			},
		}))
	);
</script>

<Row>
	<Cell>
		<div class="inline">
			{#if $report !== -1}
				<div
					style:width="24px"
					style:height="24px"
					style:cursor="pointer"
					style:margin-right="10px">
					<Icon
						component={Svg}
						viewBox="0 0 24 24"
						class="material-icons"
						on:click={(e) => {
							e.stopPropagation();
							reports.update((reps) => {
								let rep = reps[$report];
								rep.reportPredicates.push({
									sliceName: sli.sliceName,
									metric: $metric,
									transform: $transform,
								});
								reps[$report] = rep;
								return reps;
							});
						}}>
						<path fill="#6a1b9a" d={mdiPlusCircleOutline} />
					</Icon>
				</div>
			{/if}
			<SliceDetailsContainer {sli} />
		</div>
	</Cell>
	{#await modelResults then res}
		{#each res as r}
			<Cell>{r.metric.toFixed(2)}</Cell>
		{/each}
	{/await}
</Row>

<style>
	.inline {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	:global(.detail-row) {
		border: none;
	}
</style>
