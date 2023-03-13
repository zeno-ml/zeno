<script lang="ts">
	import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
	import { Icon } from "@smui/button";
	import IconButton from "@smui/icon-button";
	import { report, reports } from "../../stores";
	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";
	import TableReportSliceRow from "./TableReportSliceRow.svelte";
	import TableReportModelRow from "./TableReportModelRow.svelte";

	let table: HTMLDivElement;
	const rowMap = {
		slices: TableReportSliceRow,
		models: TableReportModelRow,
	};
	$: currentReport = $reports[$report];
	$: selectModels = currentReport.models;
	$: selectSlices = currentReport.slices;
	$: parameters = currentReport.parameters;
</script>

<div id="container">
	<div bind:this={table}>
		<DataTable style="max-width: calc(100vw - 450px);">
			{#if parameters.yEncoding === "slices"}
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							Slices
						</Cell>
						<Cell>Metric</Cell>
						{#each selectModels as m}
							<Cell>{m}</Cell>
						{/each}
					</Row>
				</Head>
				<Body style="overflow: visible">
					{#each selectSlices as slice, sliceIndex}
						<svelte:component
							this={rowMap[parameters.yEncoding]}
							{slice}
							{sliceIndex} />
					{/each}
				</Body>
			{:else}
				<Head>
					<Row>
						<Cell class="sticky" style="border-right: 1px solid #e8e8e8">
							Models
						</Cell>
						<Cell>Metric</Cell>
						{#each selectSlices as slice, sliceIndex}
							<Cell>
								<div class="inline">
									{#if slice}
										<SliceDetailsContainer sli={slice} />
									{/if}
									<div class="group">
										<IconButton
											on:click={(e) => {
												e.stopPropagation();
												selectSlices.splice(sliceIndex, 1);
												reports.update((reps) => {
													reps[$report] = currentReport;
													return reps;
												});
											}}>
											<Icon class="material-icons">delete_outline</Icon>
										</IconButton>
									</div>
								</div>
							</Cell>
						{/each}
					</Row>
				</Head>
				<Body style="overflow: visible">
					{#each selectModels as model}
						<svelte:component this={rowMap[parameters.yEncoding]} {model} />
					{/each}
				</Body>
			{/if}
		</DataTable>
	</div>
</div>

<style>
	#container {
		margin-left: 20px;
	}
	.inline {
		display: flex;
		align-items: center;
	}
	.group {
		margin-left: 10px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
</style>
