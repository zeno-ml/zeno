<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import { models, report, reports } from "../../stores";
	import TimeseriesReportTableRow from "./TimeseriesReportTableRow.svelte";

	let table: HTMLDivElement;

	$: currReport = $reports[$report];
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
					<Cell class="end-cell">Trend</Cell>
					{#each $models as m}
						<Cell>{m}</Cell>
					{/each}
				</Row>
			</Head>
			<Body style="overflow: visible">
				{#each currReport.reportPredicates as predicate, i}
					<TimeseriesReportTableRow {predicate} predicateIndex={i} />
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
