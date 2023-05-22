<script lang="ts">
	import { report, reports, slices } from "../../stores";
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import TableReportRow from "./TableReportRow.svelte";

	let table: HTMLDivElement;

	$: currentReport = $reports[$report];
	$: selectModels = currentReport.models;
	$: selectMetrics = currentReport.metrics;
	$: selectSlices = currentReport.slices;
	$: parameters = currentReport.parameters;
	$: fixed_dimension = currentReport.parameters.fixedDimension;
</script>

<div id="container">
	<div bind:this={table}>
		<DataTable style="max-width: calc(100vw - 450px);">
			<Head>
				<Row>
					<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
						{parameters.yEncoding}
					</Cell>
					<Cell>{parameters.zEncoding}</Cell>
					{#if parameters.xEncoding === "slices"}
						{#each selectSlices as slice}
							<Cell>
								<div class="inline">
									{#if slice}
										<SliceDetailsContainer sli={$slices.get(slice)} />
									{/if}
								</div>
							</Cell>
						{/each}
					{:else if parameters.xEncoding === "models"}
						{#each selectModels as m}
							<Cell>{m}</Cell>
						{/each}
					{/if}
				</Row>
			</Head>
			<Body style="overflow: visible">
				{#if fixed_dimension === "z"}
					{#if parameters.yEncoding === "slices"}
						{#each selectSlices as slice}
							<TableReportRow
								row={slice}
								{fixed_dimension}
								{parameters}
								{currentReport} />
						{/each}
					{:else if parameters.yEncoding === "models"}
						{#each selectModels as model}
							<TableReportRow
								row={model}
								{fixed_dimension}
								{parameters}
								{currentReport} />
						{/each}
					{/if}
				{:else if fixed_dimension === "y"}
					{#each selectMetrics as metric}
						<TableReportRow
							row={metric}
							{fixed_dimension}
							{parameters}
							{currentReport} />
					{/each}
				{/if}
			</Body>
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
		margin-top: 20px;
	}
	.inline {
		display: flex;
		align-items: center;
	}
</style>
