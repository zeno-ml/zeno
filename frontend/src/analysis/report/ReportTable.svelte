<script lang="ts">
	import html2pdf from "html2pdf.js";

	import Button from "@smui/button";
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";

	import { models } from "../../stores";

	import ReportTableRow from "./ReportTableRow.svelte";

	export let report: Report;

	let table: HTMLDivElement;
</script>

<div id="container">
	<div class="inline">
		<h4 style:margin-right="20px">{report.name}</h4>
		<div class="export">
			<Button
				variant="outlined"
				on:click={() => {
					let img = new Image(220, 100);
					img.src = "build/zeno.png";
					img.onload = () => {
						let divElem = document.createElement("div");
						divElem.innerHTML = "<br />" + table.innerHTML;
						divElem.prepend(img);
						html2pdf(divElem, {
							margin: [0, 20, 20, 20],
							filename: "report.pdf",
							image: { type: "jpeg", quality: 0.98 },
							html2canvas: { scale: 2 },
							jsPDF: { orientation: "l" },
						});
					};
				}}>Export</Button>
		</div>
	</div>

	<div bind:this={table}>
		<DataTable style="max-width: calc(100vw - 500px)">
			<Head>
				<Row>
					<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
						Slice
					</Cell>
					<Cell>Test</Cell>
					<Cell>Transform</Cell>
					<Cell>Metric</Cell>
					<Cell class="end-cell">Trend</Cell>
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
	</div>
</div>

<style>
	.inline {
		display: flex;
		flex-direction: inline;
		align-items: center;
	}
	#container {
		margin-left: 10px;
	}
</style>
