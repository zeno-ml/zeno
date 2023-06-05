<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import { slices } from "../../stores";

	export let yCell: string;
	export let parameters;
	export let currentReport;
	export let result;
</script>

<Row style="overflow: visible">
	<!-- y cell -->
	<Cell>
		{#if parameters.yEncoding === "slices"}
			<SliceDetailsContainer sli={$slices.get(yCell)} />
		{:else if parameters.yEncoding === "models"}
			{yCell}
		{/if}
	</Cell>
	{#each result as r}
		<Cell style="text-align: center;">
			<p>
				{!r.metric ||
				(parameters.zEncoding === "metrics" &&
					currentReport.metrics[0] === "size")
					? r.size
					: r.metric.toFixed(2)}
			</p>
		</Cell>
	{/each}
</Row>

<style>
	:global(.sticky) {
		overflow: visible;
		left: 0px;
		background: var(--G6);
		z-index: 0;
	}
</style>
