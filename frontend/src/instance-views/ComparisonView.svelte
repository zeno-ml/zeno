<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import Svelecte from "svelecte";
	import { tick } from "svelte";
	import { getFilteredTable } from "../api/table";
	import {
		comparisonModels,
		model,
		models,
		rowsPerPage,
		selectionIds,
		selectionPredicates,
		settings,
		sort,
		status,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { ZenoColumnType } from "../zenoservice";
	import type { ViewRenderFunction } from "./instance-views";

	export let currentResult;
	export let viewFunction: ViewRenderFunction;
	export let viewOptions;

	let tables = {};
	let viewDivs = {};
	let instanceContainer;

	let currentPage = 0;
	let end = 0;
	let lastPage = 0;

	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

	$: idHash = columnHash($settings.idColumn);
	$: start = currentPage * $rowsPerPage;
	$: end = Math.min(start + $rowsPerPage, $settings.totalSize);
	$: currentResult.then((r) => {
		lastPage = Math.max(Math.ceil(r[0].size / $rowsPerPage) - 1, 0);
	});
	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	// when state changes update current table view
	$: {
		$comparisonModels;
		currentPage;
		$status.completeColumns;
		$model;
		$sort;
		$selectionIds;
		updateTable();
	}

	$: if (viewFunction) {
		tables;
		$sort;
		viewOptions;
		drawInstances();
	}

	model.subscribe(() => {
		if ($comparisonModels.includes($model)) {
			$comparisonModels = $comparisonModels.filter((m) => m !== $model);
			tables[$model] = [];
			viewDivs[$model] = [];
		}
	});

	// reset page on selection change
	selectionPredicates.subscribe(() => {
		if (currentPage === 0) {
			updateTable();
		} else {
			currentPage = 0;
		}
	});

	function updateTable() {
		if (start === undefined || end === undefined) {
			return;
		}
		let proms = [$model, ...$comparisonModels].map((mod) => {
			return getFilteredTable(
				$status.completeColumns,
				$selectionPredicates,
				mod,
				[start, end],
				$sort,
				$selectionIds
			);
		});
		Promise.all(proms).then((res) => {
			const localDivs = {};
			[$model, ...$comparisonModels].forEach((mod, i) => {
				tables[mod] = res[i];
				localDivs[mod] = [];
			});
			viewDivs = localDivs;
			tables = tables;
			if (instanceContainer) {
				instanceContainer.scrollTop = 0;
			}
		});
	}

	async function drawInstances() {
		if (Object.keys(tables).length === 0) {
			return;
		}

		await tick();

		[$model, ...$comparisonModels].forEach((mod) => {
			let obj = $status.completeColumns.find((c) => {
				return c.columnType === ZenoColumnType.OUTPUT && c.name === mod;
			});
			let modelColumn = obj ? columnHash(obj) : "";

			tables[mod].forEach((_, i) => {
				let div = viewDivs[mod][i];
				if (div) {
					viewFunction(
						div,
						viewOptions,
						tables[mod][i],
						modelColumn,
						columnHash($settings.labelColumn),
						columnHash($settings.dataColumn),
						idHash
					);
				}
			});
		});
	}
</script>

<Svelecte
	options={$models.filter((m) => m !== $model)}
	labelAsValue={true}
	closeAfterSelect={true}
	bind:value={$comparisonModels}
	multiple
	placeholder="Select models to compare" />

<div class="table-container" bind:this={instanceContainer}>
	{#if tables[$model]}
		<table>
			<thead>
				{#each [$model, ...$comparisonModels] as mod}
					<th>{mod}</th>
				{/each}
			</thead>
			<tbody>
				{#each [...Array($rowsPerPage).keys()] as rowId (tables[$model][rowId] ? tables[$model][rowId][idHash] : rowId)}
					<tr>
						{#each [$model, ...$comparisonModels] as mod}
							{#if viewDivs[mod]}
								<td>
									<div bind:this={viewDivs[mod][rowId]} />
								</td>
							{/if}
						{/each}
					</tr>
				{/each}</tbody>
		</table>
	{/if}
</div>

<Pagination slot="paginate" class="pagination">
	<svelte:fragment slot="rowsPerPage">
		<Label>Rows Per Page</Label>
		<Select variant="outlined" bind:value={$rowsPerPage} noLabel>
			{#each sampleOptions as option}
				<Option value={option}>{option}</Option>
			{/each}
		</Select>
	</svelte:fragment>
	<svelte:fragment slot="total">
		{start + 1}-{#await currentResult then r}
			{Math.min(end, r ? r[0].size : end)} of
			{r ? r[0].size : ""}{/await}
	</svelte:fragment>

	<IconButton
		class="material-icons"
		action="first-page"
		title="First page"
		on:click={() => (currentPage = 0)}
		disabled={currentPage === 0}>first_page</IconButton>
	<IconButton
		class="material-icons"
		action="prev-page"
		title="Prev page"
		on:click={() => currentPage--}
		disabled={currentPage === 0}>chevron_left</IconButton>
	<IconButton
		class="material-icons"
		action="next-page"
		title="Next page"
		on:click={() => currentPage++}
		disabled={currentPage >= lastPage}>chevron_right</IconButton>
	<IconButton
		class="material-icons"
		action="last-page"
		title="Last page"
		on:click={() => (currentPage = lastPage)}
		disabled={currentPage >= lastPage}>last_page</IconButton>
</Pagination>

<style>
	table {
		margin-top: 5px;
	}
	td {
		vertical-align: top;
	}
	thead th {
		text-align: left;
		border-bottom: 1px solid var(--G5);
		padding-bottom: 5px;
		top: 2px;
		left: 0;
		position: sticky;
		background-color: var(--G6);
		min-width: 70px;
		padding-right: 1.6vw;
		cursor: pointer;
	}
	.table-container {
		max-width: calc(100vw - 450px);
		max-height: calc(100vh - 205px);
		overflow: scroll;
	}
</style>
