<script lang="ts">
	import { mdiPlusCircleOutline } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import { Cell, Row } from "@smui/data-table";

	import { metric, models, report, reports, transform } from "../../stores";
	import { getMetricsForSlices } from "../../util/util";

	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";
	import SparkLine from "../SparkLine.svelte";

	export let sli: Slice;

	$: modelResults = getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			metric: $metric,
			model: m,
			transform: $transform,
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
									operation: "",
									transform: $transform,
									value: "",
									results: [],
								});
								reps[$report] = rep;
								return reps;
							});
						}}>
						<path fill="#9b51e0" d={mdiPlusCircleOutline} />
					</Icon>
				</div>
			{/if}
			<SliceDetailsContainer {sli} />
		</div>
	</Cell>
	{#await modelResults then res}
		{#if $models.length > 2}
			<Cell><SparkLine {res} /></Cell>
		{/if}
		{#each res as r}
			<Cell>
				{r ? r.toFixed(2) : ""}
			</Cell>
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
