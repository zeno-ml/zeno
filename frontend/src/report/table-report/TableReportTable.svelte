<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import { report, reports } from "../../stores";
	import TableReportTableRow from "./TableReportTableRow.svelte";

	let table: HTMLDivElement;

	$: currentReport = $reports[$report];
	$: selectModels = currentReport.models;
	$: selectSlices = currentReport.slices;
</script>

<div id="container">
	<div bind:this={table}>
		<DataTable style="max-width: calc(100vw - 450px);">
			<Head>
				<Row>
					<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
						Slice
					</Cell>
					<Cell>Metric</Cell>
					{#each selectModels as m}
						<Cell>{m}</Cell>
					{/each}
				</Row>
			</Head>
			<Body style="overflow: visible">
				{#each selectSlices as slice, i}
					<TableReportTableRow {slice} sliceIndex={i} />
				{/each}
			</Body>
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
	}
</style>
