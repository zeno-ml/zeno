<script lang="ts">
	import html2pdf from "html2pdf.js";

	import Button from "@smui/button";
	import Select, { Option } from "@smui/select";

	import {
		metric,
		metrics,
		transform,
		transforms,
		report,
		reports,
	} from "../stores";

	import ReportsList from "./ReportsList.svelte";
	import SliceTable from "./slice-table/SliceTable.svelte";
	import ReportTable from "./report/ReportTable.svelte";

	let table: HTMLDivElement;
</script>

<div class="inline">
	<div>
		<ReportsList />
	</div>
	<div>
		{#if $reports[$report]}
			<ReportTable report={$reports[$report]} />
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
		{/if}
		<div class="settings">
			{#if $metrics}
				<Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
					{#each $metrics as m}
						<Option value={m}>{m}</Option>
					{/each}
				</Select>
			{/if}
			{#if $transforms}
				<Select
					bind:value={$transform}
					label="Transform"
					style="margin-right: 20px;">
					{#each ["", ...$transforms] as t}
						<Option value={t}>{t}</Option>
					{/each}
				</Select>
			{/if}
		</div>
		<div class="table" bind:this={table}>
			<SliceTable />
		</div>
	</div>
</div>

<style>
	.export {
		margin-top: 15px;
		display: flex;
		flex-direction: row-reverse;
	}
	.inline {
		display: flex;
		flex-direction: row;
	}
	.table {
		margin-top: 20px;
	}
	.settings {
		margin-top: 30px;
	}
</style>
