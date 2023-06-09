<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import Svelecte from "svelecte";
	import { tick } from "svelte";
	import { getFilteredTable } from "../api/table";
	import {
		comparisonModel,
		model,
		models,
		metric,
		rowsPerPage,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
		compareSort,
		status,
		tagIds,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { ZenoColumnType, MetadataType } from "../zenoservice";
	import type { ViewRenderFunction } from "./instance-views";
	import ComparisonViewTableHeader from "./ComparisonViewTableHeader.svelte";

	export let modelAResult;
	export let modelBResult;
	export let viewFunction: ViewRenderFunction;
	export let viewOptions;

	let tables = {};
	let viewDivs = {};
	let instanceContainer;

	// decide which model column to show sort icon
	let sortModel = "";

	let options = $status.completeColumns.filter(
		(c) =>
			c.model === "" ||
			c.model === $model ||
			(sortModel === "" && c.model === $model)
	);
	let selectColumn = options[0];

	let currentPage = 0;
	let lastPage = 0;
	let totalSize = $settings.totalSize;
	let metricA = 0;
	let metricB = 0;

	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

	$: modelAResult.then((r) => {
		totalSize = r[0].size;
		metricA = r[0].metric.toFixed(2);
	});

	$: modelBResult.then((r) => {
		metricB = r[0].metric.toFixed(2);
	});

	$: idHash = columnHash($settings.idColumn);
	$: start = currentPage * $rowsPerPage;
	$: end = Math.min(start + $rowsPerPage, totalSize);
	$: lastPage = Math.max(Math.ceil(totalSize / $rowsPerPage) - 1, 0);
	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	// when state changes update current table view
	$: {
		currentPage;
		$comparisonModel;
		$rowsPerPage;
		$status.completeColumns;
		$model;
		$compareSort;
		$selectionIds;
		$selectionPredicates;
		$tagIds;
		$selections.tags;
		start, end, updateTable();
	}

	$: {
		viewFunction;
		tables;
		$compareSort;
		viewOptions;
		drawInstances();
	}

	model.subscribe((model) => {
		// make sure Model A and Model B are exclusive
		if ($comparisonModel.includes(model)) {
			$comparisonModel = $models.filter((m) => m !== model)[0];
			tables[model] = [];
			viewDivs[model] = [];
		}
	});

	// reset page on selection change
	selectionPredicates.subscribe(() => {
		if (currentPage !== 0) {
			currentPage = 0;
		}
	});

	// trigger this function when clicking column header to sort
	function updateSort(selectColumn, model) {
		// when clicking different model columns, reset compareSort
		if (sortModel !== model) {
			compareSort.set([undefined, true]);
			sortModel = model;
		}

		// assign new model to the selected column
		let newHeader = model ? setColumnModel(selectColumn, model) : "diff";

		let compareSortString = JSON.stringify($compareSort[0]);
		let newHeaderString = JSON.stringify(newHeader);

		if (compareSortString !== newHeaderString) {
			compareSort.set([newHeader, true]);
		} else if (compareSortString === newHeaderString && $compareSort[1]) {
			compareSort.set([newHeader, false]);
		} else {
			compareSort.set([undefined, true]);
		}
	}

	// set model for postdistill/output column
	function setColumnModel(col, model) {
		let col_copy = Object.assign({}, col);
		col_copy.model =
			col.columnType === ZenoColumnType.POSTDISTILL ||
			col.columnType === ZenoColumnType.OUTPUT
				? model
				: "";
		return col_copy;
	}

	function updateTable() {
		if (start === undefined || end === undefined) {
			return;
		}

		getFilteredTable(
			$status.completeColumns,
			[$model, $comparisonModel],
			selectColumn,
			$selectionPredicates,
			[start, end],
			$compareSort,
			$tagIds,
			$selectionIds,
			$selections.tags
		).then((res) => {
			const localDivs = {};
			[$model, $comparisonModel].forEach((mod) => {
				tables[mod] = res;
				localDivs[mod] = [];
			});
			viewDivs = localDivs;
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

		[$model, $comparisonModel].forEach((mod) => {
			let obj = $status.completeColumns.find((c) => {
				return c.columnType === ZenoColumnType.OUTPUT && c.model === mod;
			});
			let modelColumn = obj ? columnHash(obj) : "";
			if (tables[mod] && viewDivs[mod]) {
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
			}
		});
	}
</script>

<div style="display: flex; align-items:center;">
	<h4 style="margin-right: 10px">Comparison Feature:</h4>
	<Svelecte
		style="padding-top: 5px;padding-bottom: 5px; z-index:6"
		value={selectColumn}
		placeholder={"Column"}
		valueAsObject
		valueField={"name"}
		{options}
		on:change={(e) => {
			if (e.detail !== selectColumn) {
				selectColumn = e.detail;
				// reset tables data to prevent rerender the existing(non-updated) data
				tables[$model] = [];
				tables[$comparisonModel] = [];
				compareSort.set([undefined, true]);
			}
		}} />
</div>
<div class="table-container" bind:this={instanceContainer}>
	{#if tables[$model] && tables[$comparisonModel]}
		<table>
			<thead>
				<th>
					<div>{$model}</div>
					<div>
						<span class="metric">
							{$metric ? $metric + ":" : ""}
						</span>
						<span class="metric-value">
							{metricA}
						</span>
					</div>
				</th>
				<th>
					<div>{$comparisonModel}</div>
					<div>
						<span class="metric">
							{$metric ? $metric + ":" : ""}
						</span>
						<span class="metric-value">
							{metricB}
						</span>
					</div>
				</th>
				<th on:click={() => updateSort(selectColumn, $model)}>
					<ComparisonViewTableHeader
						{selectColumn}
						{sortModel}
						header={$model} />
				</th>
				<th on:click={() => updateSort(selectColumn, $comparisonModel)}>
					<ComparisonViewTableHeader
						{selectColumn}
						{sortModel}
						header={$comparisonModel} />
				</th>
				<th on:click={() => updateSort(selectColumn, "")}>
					<ComparisonViewTableHeader {selectColumn} {sortModel} header={""} />
				</th>
			</thead>
			<tbody>
				{#each [...Array(end - start).keys()] as rowId (tables[$model][rowId] ? tables[$model][rowId][idHash] : rowId)}
					{@const val = (mod, diff) => {
						let row = tables[mod][rowId];
						let newHeader = setColumnModel(selectColumn, mod);
						let key = diff ? "diff" : columnHash(newHeader);
						return row
							? newHeader.metadataType === MetadataType.CONTINUOUS
								? row[key].toFixed(2)
								: row[key]
							: "";
					}}
					<tr>
						{#each [$model, $comparisonModel] as mod}
							{#if viewDivs[mod]}
								<td>
									<div
										style="vertical-align: top"
										bind:this={viewDivs[mod][rowId]} />
								</td>
							{/if}
						{/each}
						<td>{val($model, false)}</td>
						<td>{val($comparisonModel, false)}</td>
						<td>{val($model, true)}</td>
					</tr>
				{/each}
			</tbody>
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
		{totalSize === 0 ? start : start + 1} -
		{Math.min(end, totalSize)} of
		{totalSize}
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
	th {
		width: 160px;
		text-align: left;
		border-bottom: 1px solid var(--G5);
		padding-bottom: 5px;
		top: 0;
		left: 0;
		position: sticky;
		background-color: var(--G6);
		min-width: 70px;
		padding-right: 1.6vw;
		vertical-align: top;
		cursor: pointer;
		font-weight: 600;
		z-index: 5;
	}
	td {
		padding-right: 10px;
	}
	.metric {
		font-weight: 400;
		font-size: 15px;
		color: var(--G2);
		margin-right: 15px;
	}
	.metric-value {
		font-weight: 400;
		color: var(--logo);
		margin-right: 15px;
	}
	.table-container {
		max-width: calc(100vw - 440px);
		height: calc(100vh - 170px);
		max-height: calc(100vh - 170px);
		overflow: scroll;
	}
</style>
