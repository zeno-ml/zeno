<script lang="ts">
	import { mdiPlusCircleOutline } from "@mdi/js";
	import { Icon } from "@smui/common";
	import { Svg } from "@smui/common/elements";
	import { Cell, Row } from "@smui/data-table";

	import { metric, models, report, reports, transform } from "../../stores";
	import { getMetricsForSlices, updateReports } from "../../util";

	import SliceCell from "../SliceCell.svelte";

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
								});
								reps[$report] = rep;
								updateReports(reps);
								return reps;
							});
						}}>
						<path fill="#9b51e0" d={mdiPlusCircleOutline} />
					</Icon>
				</div>
			{/if}
			<SliceCell {sli} />
		</div>
	</Cell>
	{#each $models as m, i}
		{#await modelResults then res}
			<Cell>
				{res[i] ? res[i].toFixed(2) : ""}
			</Cell>
		{/await}
	{/each}
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
