<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { tick } from "svelte";
	import { getFilteredTable } from "../api/table";
	import { setModelForFilterPredicateGroup } from "../api/slice";
	import {
		model,
		rowsPerPage,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
		sort,
		status,
		tagIds,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { ZenoColumnType } from "../zenoservice";
	import type { ViewRenderFunction } from "./instance-views";

	export let currentResult;
	export let viewFunction: ViewRenderFunction;
	export let viewOptions;

	let table;
	let viewDivs = {};

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
		currentPage;
		$rowsPerPage;
		$status.completeColumns;
		$selections.tags;
		$model;
		$sort;
		$tagIds;
		$selectionIds;
		updateTable();
	}

	$: if (viewFunction) {
		table;
		$sort;
		viewOptions;
		drawInstances();
	}

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

		getFilteredTable(
			$status.completeColumns,
			[$model],
			undefined,
			setModelForFilterPredicateGroup($selectionPredicates, $model),
			[start, end],
			$sort,
			$tagIds,
			$selectionIds,
			$selections.tags
		).then((res) => (table = res));
	}

	async function drawInstances() {
		if (!table) {
			return;
		}

		let obj = $status.completeColumns.find((c) => {
			return c.columnType === ZenoColumnType.OUTPUT && c.model === $model;
		});
		let modelColumn = obj ? columnHash(obj) : "";

		await tick();

		table.forEach((_, i) => {
			let div = viewDivs[i];
			if (div) {
				viewFunction(
					div,
					viewOptions,
					table[i],
					modelColumn,
					columnHash($settings.labelColumn),
					columnHash($settings.dataColumn),
					idHash
				);
			}
		});
	}
</script>

{#if table}
	<div class="container sample-container">
		{#each table as inst, i (inst[idHash])}
			<div class="instance" bind:this={viewDivs[i]} />
		{/each}
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
{/if}

<style>
	.sample-container {
		height: calc(100vh - 180px);
		overflow-y: auto;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
		display: flex;
		flex-wrap: wrap;
	}
	.instance {
		margin-right: 5px;
		margin-top: 2.5px;
		margin-bottom: 2.5px;
	}
</style>
