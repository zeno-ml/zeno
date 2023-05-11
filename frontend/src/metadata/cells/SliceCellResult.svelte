<script lang="ts">
	import { comparisonModels, metric, status, model } from "../../stores";
	import { getMetricsForSlices } from "../../api/slice";
	import { type MetricKey, type Slice } from "../../zenoservice";

	export let compare;
	export let slice: Slice;

	let result;
	let resultCompare;
	$: {
		$status;
		result = getMetricsForSlices([
			<MetricKey>{
				sli: slice,
				model: $model,
				metric: $metric,
			},
		]);
		if (compare) {
			resultCompare = getMetricsForSlices([
				<MetricKey>{
					sli: slice,
					model: $comparisonModels[0],
					metric: $metric,
				},
			]);
		}
	}
</script>

{#if result}
	{#await result then res}
		<div class={compare ? "cell-compare-res" : "flex-row"}>
			<span>
				{res[0].metric !== undefined && res[0].metric !== null
					? res[0].metric.toFixed(2)
					: ""}
			</span>
			<span id="size">
				({res[0].size.toLocaleString()})
			</span>
		</div>
	{/await}
{/if}
{#if compare && resultCompare}
	{#await resultCompare then res}
		<div class="cell-compare-res">
			<span>
				{res[0].metric !== undefined && res[0].metric !== null
					? res[0].metric.toFixed(2)
					: ""}
			</span>
			<span id="size">
				({res[0].size.toLocaleString()})
			</span>
		</div>
	{/await}
{/if}

<style>
	.flex-row {
		display: flex;
		align-items: center;
	}
	span {
		width: 50px;
		margin-right: 5px;
		text-align: right;
	}
	#size {
		font-style: italic;
		color: var(--G3);
	}
	.cell-compare-res {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 5px;
	}
</style>
