<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models } from "../../stores";

	import ReportTableRow from "./ReportTableRow.svelte";

	export let report: Report;
</script>

<h4>{report.name}</h4>

<DataTable table$aria-label="People list" style="max-width: 100%;">
	<Head>
		<Row>
			<Cell>{""}</Cell>
			<Cell>Test</Cell>
			<Cell>Transform</Cell>
			<Cell>Metric</Cell>
			{#each $models as m}
				<Cell>{m}</Cell>
			{/each}
		</Row>
	</Head>
	<Body>
		{#each report.reportPredicates as predicate, i}
			<ReportTableRow {predicate} predicateIndex={i} />
		{/each}
	</Body>
</DataTable>
