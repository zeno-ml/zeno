<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { tick } from "svelte";
	import { getFilteredTable } from "../api/table";
	import {
		model,
		models,
		comparisonModels,
		rowsPerPage,
		selectionIds,
		selectionPredicates,
		settings,
		sort,
		status,
	} from "../stores";
	import { columnHash } from "../util/util";
	import { ZenoColumnType } from "../zenoservice";
	import Svelecte from "svelecte";
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
			[$model, ...$comparisonModels].forEach((mod, i) => {
				tables[mod] = res[i];
				viewDivs[mod] = {};
			});
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

			let ids = tables[mod].map((inst) => inst[idHash]);
			viewDivs[mod] = Object.fromEntries(
				ids
					.map(
						(key) =>
							!!Object.getOwnPropertyDescriptor(viewDivs[mod], key) && [
								key,
								viewDivs[mod][key],
							]
					)
					.filter(Boolean)
			);
			tables[mod].forEach((inst, i) => {
				let div = viewDivs[mod][inst[idHash]];
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

<div class="columns" bind:this={instanceContainer}>
	{#each [$model, ...$comparisonModels] as mod}
		<div class="sample-container">
			<h5 class="sticky">{mod}</h5>
			{#if tables[mod]}
				{#each tables[mod] as inst (inst[idHash])}
					<div class="instance" bind:this={viewDivs[mod][inst[idHash]]} />
				{/each}
			{/if}
		</div>
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
		{start + 1}-{end} of {#await currentResult then r}{r
				? r[0].size
				: ""}{/await}
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
	.sample-container {
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
		display: flex;
		flex-direction: column;
		padding-right: 10px;
		padding-left: 10px;
		border-right: 1px solid rgb(224, 224, 224);
		height: fit-content;
	}
	.columns {
		height: calc(100vh - 205px);
		display: flex;
		width: min-content;
		overflow-y: auto;
		flex-direction: row;
		width: 100%;
	}
	.sticky {
		position: sticky;
		top: 0;
		padding-bottom: 10px;
		padding-top: 10px;
		border-bottom: 1px solid rgb(224, 224, 224);
		margin: 0px;
	}
	.instance {
		margin-right: 5px;
		margin-top: 2.5px;
		margin-bottom: 2.5px;
	}
</style>
