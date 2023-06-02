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
	let selectSort = $model;
	let columnHeader = $status.completeColumns.filter(
		(c) =>
			(c.model === "" || c.model === $model) &&
			(c.columnType === ZenoColumnType.PREDISTILL ||
				c.columnType === ZenoColumnType.POSTDISTILL)
	)[0];

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

	function updateSort(columnHeader, model) {
		if (selectSort !== model) {
			compareSort.set([undefined, true]);
			selectSort = model;
		}

		let newHeader = Object.assign({}, columnHeader);
		newHeader.name = model ? newHeader.name : newHeader.name + "_diff";
		newHeader.model =
			columnHeader.columnType === ZenoColumnType.POSTDISTILL ? model : "";

		if (JSON.stringify($compareSort[0]) !== JSON.stringify(newHeader)) {
			compareSort.set([newHeader, true]);
		} else if (
			JSON.stringify($compareSort[0]) === JSON.stringify(newHeader) &&
			$compareSort[1]
		) {
			compareSort.set([newHeader, false]);
		} else {
			compareSort.set([undefined, true]);
		}
	}

	function updateTable() {
		if (start === undefined || end === undefined) {
			return;
		}
		// add a difference ZenoColumn before getting filter tables
		let diffHeader = Object.assign({}, columnHeader);
		diffHeader.name += "_diff";
		diffHeader.model = "";

		getFilteredTable(
			$status.completeColumns.concat(diffHeader),
			[$model, $comparisonModel],
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

<Svelecte
	style="padding-top: 5px;padding-bottom: 5px"
	value={columnHeader}
	placeholder={"Column"}
	valueAsObject
	valueField={"name"}
	options={$status.completeColumns.filter(
		(c) =>
			(c.model === "" ||
				c.model === selectSort ||
				(selectSort === "" && c.model === $model)) &&
			(c.columnType === ZenoColumnType.PREDISTILL ||
				c.columnType === ZenoColumnType.POSTDISTILL)
	)}
	on:change={(e) => {
		if (e.detail !== columnHeader) {
			columnHeader = e.detail;
			compareSort.set([undefined, true]);
		}
	}} />

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
				<th on:click={() => updateSort(columnHeader, $model)}>
					<ComparisonViewTableHeader
						{columnHeader}
						{selectSort}
						model={$model} />
				</th>
				<th on:click={() => updateSort(columnHeader, $comparisonModel)}>
					<ComparisonViewTableHeader
						{columnHeader}
						{selectSort}
						model={$comparisonModel} />
				</th>
				<th on:click={() => updateSort(columnHeader, "")}>
					<ComparisonViewTableHeader {columnHeader} {selectSort} model={""} />
				</th>
			</thead>
			<tbody>
				{#each [...Array(end - start).keys()] as rowId (tables[$model][rowId] ? tables[$model][rowId][idHash] : rowId)}
					{@const val = (mod, diff) => {
						let newHeader = Object.assign({}, columnHeader);
						newHeader.model =
							!diff && newHeader.columnType === ZenoColumnType.POSTDISTILL
								? mod
								: "";
						newHeader.name = !diff ? newHeader.name : newHeader.name + "_diff";
						return tables[mod][rowId] &&
							columnHash(newHeader) in tables[mod][rowId]
							? newHeader.metadataType === MetadataType.CONTINUOUS
								? tables[mod][rowId][columnHash(newHeader)].toFixed(2)
								: tables[mod][rowId][columnHash(newHeader)]
							: "";
					}}
					<tr>
						{#each [$model, $comparisonModel] as mod}
							{#if viewDivs[mod]}
								<td>
									<div bind:this={viewDivs[mod][rowId]} />
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
	thead th {
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
		cursor: pointer;
		font-weight: 600;
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
