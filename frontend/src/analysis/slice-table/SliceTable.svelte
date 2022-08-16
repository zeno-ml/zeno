<script>
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models, slices, folders } from "../../stores";

	import SliceTableRow from "./SliceTableRow.svelte";

	let selectedFolder = "";
</script>

<div id="tabs">
	<div
		class="tab {selectedFolder === '' ? 'selected' : ''}"
		on:click={() => (selectedFolder = "")}
		style:margin-right="10px">
		All Slices
	</div>
	{#each $folders as f}
		<div
			class="tab {selectedFolder === f ? 'selected' : ''}"
			on:click={() => (selectedFolder = f)}>
			{f}
		</div>
	{/each}
</div>
<DataTable style="max-width: 100%;">
	<Head>
		<Row>
			<Cell>{""}</Cell>
			{#if $models.length > 2}
				<Cell>Trend</Cell>
			{/if}
			{#each $models as m}
				<Cell>{m}</Cell>
			{/each}
		</Row>
	</Head>
	<Body>
		{#each [...$slices.values()].filter((s) => {
			if (selectedFolder === "") {
				return true;
			} else if (selectedFolder === s.folder) {
				return true;
			} else {
				return false;
			}
		}) as sli}
			<SliceTableRow {sli} />
		{/each}
	</Body>
</DataTable>

<style>
	#tabs {
		display: flex;
		flex-direction: inline;
	}
	.tab {
		cursor: pointer;
		padding: 10px;
		border: 1px solid #e0e0e0;
		border-bottom: none;
		border-top-right-radius: 5px;
		border-top-left-radius: 5px;
	}

	.tab:hover {
		background: #f9f5ff;
	}

	.selected {
		background: #f9f5ff;
	}
</style>
