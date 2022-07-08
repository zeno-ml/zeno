<script>
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models, slices } from "../stores";

	import AnalysisTableRow from "./AnalysisTableRow.svelte";
</script>

<DataTable table$aria-label="People list" style="max-width: 100%;">
	<Head>
		<Row>
			<Cell>{""}</Cell>
			{#each $models as m}
				<Cell>{m}</Cell>
			{/each}
		</Row>
	</Head>
	<Body>
		{#each [...$slices.values()] as sli}
			<AnalysisTableRow {sli} />
		{/each}
	</Body>
</DataTable>
