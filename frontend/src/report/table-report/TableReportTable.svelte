<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import { report, reports } from "../../stores";
	import SliceDetailsContainer from "./SliceDetailsContainer.svelte";
	import TableReportSliceRow from "./TableReportSliceRow.svelte";
	import TableReportModelRow from "./TableReportModelRow.svelte";

	const rowMap = {
		slices: TableReportSliceRow,
		models: TableReportModelRow,
	};

	let table: HTMLDivElement;

	$: currentReport = $reports[$report];
	$: selectModels = currentReport.models;
	$: selectSlices = currentReport.slices;
	$: parameters = currentReport.parameters;
</script>

<div id="container">
	<div bind:this={table}>
		<DataTable style="max-width: calc(100vw - 450px);">
			{#if parameters.yEncoding === "slices"}
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							Slices
						</Cell>
						<Cell>Metric</Cell>
						{#each selectModels as m}
							<Cell>{m}</Cell>
						{/each}
					</Row>
				</Head>
				<Body style="overflow: visible">
					{#each selectSlices as slice}
						<svelte:component this={rowMap[parameters.yEncoding]} {slice} />
					{/each}
				</Body>
			{:else}
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							Models
						</Cell>
						<Cell>Metric</Cell>
						{#each selectSlices as slice, sliceIndex}
							<Cell>
								<div class="inline">
									{#if slice}
										<SliceDetailsContainer sli={slice} />
									{/if}
								</div>
							</Cell>
						{/each}
					</Row>
				</Head>
				<Body style="overflow: visible">
					{#each selectModels as model}
						<svelte:component this={rowMap[parameters.yEncoding]} {model} />
					{/each}
				</Body>
			{/if}
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
	}
	.inline {
		display: flex;
		align-items: center;
	}
</style>
