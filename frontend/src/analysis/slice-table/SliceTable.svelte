<script>
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models, slices } from "../../stores";

	import SliceTableRow from "./SliceTableRow.svelte";
</script>

<DataTable style="max-width: 100%;">
	<Head>
		<Row>
			<Cell>{""}</Cell>
			{#each $models.slice().reverse() as m}
				<Cell>{m}</Cell>
			{/each}
		</Row>
	</Head>
	<Body>
		{#each [...$slices.values()] as sli}
			<SliceTableRow {sli} />
		{/each}
	</Body>
</DataTable>
