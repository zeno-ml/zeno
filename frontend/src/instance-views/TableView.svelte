<script lang="ts">
	import { Icon, Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { MetadataType, ZenoColumnType } from "../globals";
	import { tick } from "svelte";
	import { getFilteredTable } from "../api";
	import {
		rowsPerPage,
		selectionPredicates,
		settings,
		sort,
		status,
		model,
		zenoState,
	} from "../stores";
	import { columnHash } from "../util/util";

	export let currentResult;
	export let table;
	export let viewFunction: View.Component;
	export let viewOptions: View.Options = {};

	let viewDivs = {};
	let columnHeader: ZenoColumn[] = [];
	let body: HTMLElement;

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

	// update on page, metadata selection, slice selection, or state change.
	$: {
		$status.completeColumns;
		$selectionPredicates;
		$zenoState;
		$sort;
		currentPage;
		updateTable();
	}

	$: {
		viewFunction;
		table;
		$sort;
		viewOptions;
		drawInstances();
	}

	// Reset pagination on metadata selection or slice selection.
	selectionPredicates.subscribe(() => (currentPage = 0));

	function updateTable() {
		getFilteredTable(
			$status.completeColumns,
			$selectionPredicates,
			$zenoState,
			[start, end],
			$sort
		).then((res) => {
			table = res;
			body ? body.scrollIntoView() : "";
		});
	}

	function updateSort(columnName) {
		if ($sort[0] !== columnName) {
			sort.set([columnName, true]);
		} else if ($sort[0] === columnName && $sort[1] === true) {
			sort.set([columnName, false]);
		} else {
			sort.set([undefined, true]);
		}
	}

	async function drawInstances() {
		let obj = $status.completeColumns.find((c) => {
			return c.columnType === ZenoColumnType.OUTPUT && c.name === $model;
		});
		let modelColumn = obj ? columnHash(obj) : "";

		await tick();

		columnHeader = $status.completeColumns.filter(
			(c) =>
				(c.model === "" || c.model === $zenoState.model) &&
				(c.columnType === 0 || c.columnType === 1 || c.columnType === 4)
		);
		let ids = table.map((inst) => inst[idHash]);

		if (!viewFunction) {
			return;
		}

		viewDivs = Object.fromEntries(
			ids
				.map(
					(key) =>
						!!Object.getOwnPropertyDescriptor(viewDivs, key) && [
							key,
							viewDivs[key],
						]
				)
				.filter(Boolean)
		);
		table.forEach((inst, i) => {
			let div = viewDivs[inst[idHash]];
			if (div) {
				viewFunction(
					div,
					viewOptions,
					table[i],
					modelColumn,
					columnHash($settings.labelColumn),
					columnHash($settings.dataColumn),
					$settings.dataOrigin,
					idHash
				);
			}
		});
	}
</script>

{#if table}
	<div class="sample-container">
		<table id="column-table">
			<thead>
				<tr>
					{#if viewFunction}
						<th>instance</th>
					{/if}
					{#each columnHeader as header}
						{#if header.name !== $settings.idColumn.name}
							<th on:click={() => updateSort(header)}>
								<div class="inline-header">
									{header.name}
									<Icon
										class="material-icons"
										style="font-size: 14px; padding-top:3px; margin-left: 5px;">
										{#if $sort[0] && $sort[0].name === header.name && $sort[1]}
											keyboard_arrow_down
										{:else if $sort[0] && $sort[0].name === header.name}
											keyboard_arrow_up
										{/if}
									</Icon>
								</div>
							</th>
						{/if}
					{/each}
				</tr>
			</thead>
			<tbody bind:this={body}>
				{#each table as tableContent}
					<tr>
						{#if viewFunction}
							<td>
								<div bind:this={viewDivs[tableContent[idHash]]} />
							</td>
						{/if}
						{#each columnHeader as header}
							{#if header.name !== $settings.idColumn.name}
								{#if header.metadataType === MetadataType.CONTINUOUS}
									<td>{tableContent[columnHash(header)].toFixed(2)}</td>
								{:else}
									<td>{tableContent[columnHash(header)]}</td>
								{/if}
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
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
			disabled={currentPage === lastPage}>chevron_right</IconButton>
		<IconButton
			class="material-icons"
			action="last-page"
			title="Last page"
			on:click={() => (currentPage = lastPage)}
			disabled={currentPage === lastPage}>last_page</IconButton>
	</Pagination>
{/if}

<style>
	.inline-header {
		display: flex;
	}
	.sample-container {
		height: calc(100vh - 165px);
		width: calc(100vw - 440px);
		overflow-x: scroll;
		overflow-y: scroll;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
		display: flex;
		flex-wrap: wrap;
		min-width: 75px;
	}
	th {
		text-align: left;
		border-bottom: 1px solid #e0e0e0;
		padding-bottom: 5px;
		margin-bottom: 20px;
		margin-right: 20px;
		position: sticky;
		top: 0;
		background-color: white;
		min-width: 70px;
		margin-bottom: 5px;
		padding-right: 1.6vw;
		cursor: pointer;
	}
	td {
		padding-right: 15px;
	}
</style>
