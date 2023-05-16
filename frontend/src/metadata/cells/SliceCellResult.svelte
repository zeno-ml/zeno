<script lang="ts">
	import { metric, status } from "../../stores";
	import {
		getMetricsForSlices,
		isModelDependPredicates,
	} from "../../api/slice";
	import { type MetricKey, type Slice } from "../../zenoservice";

	export let compare;
	export let slice: Slice;
	export let model;

	let result;
	let compareButton = slice
		? isModelDependPredicates(slice.filterPredicates.predicates)
		: false;
	let selected = false;

	$: {
		$status;
		result = getMetricsForSlices([
			<MetricKey>{
				sli: slice
					? slice
					: {
							sliceName: "",
							folder: "",
							filterPredicates: { predicates: [], join: "" },
					  },
				model: model,
				metric: $metric,
			},
		]);
	}
	function selectFilter(e) {
		if (compareButton) {
			e.stopPropagation();
			selected = !selected;
		}
	}
</script>

{#if result}
	{#await result then res}
		<div
			class={compare
				? "compare " +
				  (compareButton ? "compare-btn " + (selected ? "selected" : "") : "")
				: "flex-row"}
			on:keydown={() => ({})}
			on:click={selectFilter}>
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
	.compare {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 5px;
		padding: 1px;
	}
	.compare-btn {
		border: 0.5px solid var(--G4);
		border-radius: 5px;
	}
	.compare-btn:hover {
		cursor: pointer;
	}
	.selected {
		background: var(--P3);
	}
</style>
