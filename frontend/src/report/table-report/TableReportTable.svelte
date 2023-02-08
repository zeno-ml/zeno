<script lang="ts">
	import Button from "@smui/button";
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import html2pdf from "html2pdf.js";
	import { models, reports } from "../../stores";
	import TableReportTableRow from "./TableReportTableRow.svelte";
	import { updateTab } from "../../util/util";

	export let reportId: number;

	let table: HTMLDivElement;

	$: report = $reports[reportId];
</script>

<div id="container">
	<div class="inline">
		<h4
			class="report-link"
			on:keydown={() => ({})}
			on:click={() => {
				updateTab("report");
			}}>
			Reports
		</h4>
		<b>></b>
		<h4
			class="report-name"
			contenteditable="true"
			bind:textContent={$reports[reportId].name}>
			{report.name}
		</h4>
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
		<DataTable style="max-width: calc(100vw - 450px);">
			<Head>
				<Row>
					<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
						Slice
					</Cell>
					<Cell>Metric</Cell>
					{#each $models as m}
						<Cell>{m}</Cell>
					{/each}
				</Row>
			</Head>
			<Body style="overflow: visible">
				{#each report.reportPredicates as predicate, i}
					<TableReportTableRow {predicate} predicateIndex={i} />
				{/each}
			</Body>
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
	}
	.inline {
		display: flex;
		flex-direction: inline;
		align-items: center;
		max-width: calc(100vw - 450px);
	}
	.report-link {
		padding: 10px 18px 10px 0px;
		width: fit-content;
		cursor: pointer;
	}
	.report-link:hover {
		color: black;
	}
	.report-name {
		margin-left: 5px;
		margin-right: 5px;
		padding: 10px;
		width: fit-content;
	}
</style>
