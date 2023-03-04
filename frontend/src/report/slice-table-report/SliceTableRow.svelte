<script lang="ts">
	import { mdiPlusCircleOutline } from "@mdi/js";
	import { Icon, Svg } from "@smui/common";
	import { Cell, Row } from "@smui/data-table";
	import { getMetricsForSlices } from "../../api/slice";
	import { metric, models, report, reports } from "../../stores";
	import type { Slice } from "../../zenoservice";
	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";

	export let sli: Slice;

	let modelResults = null;
	$: if ($models.length > 0) {
		modelResults = getMetricsForSlices(
			$models.map((m) => ({
				sli: sli,
				metric: $metric,
				model: m,
			}))
		);
	} else {
		modelResults = getMetricsForSlices([
			{
				sli: sli,
				metric: $metric,
				model: undefined,
			},
		]);
	}
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
								rep.slices.push(sli);
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
