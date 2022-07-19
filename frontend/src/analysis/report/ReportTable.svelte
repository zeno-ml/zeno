<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models } from "../../stores";

	import ReportTableRow from "./ReportTableRow.svelte";

	export let report: Report;
</script>

<h4>{report.name}</h4>

<DataTable style="max-width: 100%; overflow: visible;">
	<Head>
		<Row>
			<Cell>{""}</Cell>
			<Cell>Transform</Cell>
			<Cell>Metric</Cell>
			<Cell class="end-cell">Test</Cell>
			{#each $models as m}
				<Cell>{m}</Cell>
			{/each}
		</Row>
	</Head>
	<Body style="overflow: visible">
		{#each report.reportPredicates as predicate, i}
			<ReportTableRow {predicate} predicateIndex={i} />
		{/each}
	</Body>
</DataTable>
