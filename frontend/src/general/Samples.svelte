<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";

	import { onMount, tick } from "svelte";
	import { ZenoColumnType } from "../globals";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import {
		model,
		rowsPerPage,
		settings,
		sort,
		status,
		transform,
		zenoState,
		selectionPredicates,
	} from "../stores";
	import { getFilteredTable } from "../api";
	import { columnHash } from "../util/util";

	export let table;

	let currentPage = 0;
	let end = 0;
	let lastPage = 0;

	let viewFunction;
	let viewDivs = {};
	let optionsDiv;
	let viewOptions = {};

	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

	$: idHash = columnHash($settings.idColumn);
	$: start = currentPage * $rowsPerPage;
	$: end = Math.min(start + $rowsPerPage, $settings.totalSize);
	$: lastPage = Math.max(Math.ceil($settings.totalSize / $rowsPerPage) - 1, 0);
	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	// update on page, metadata selection, slice selection, or state change.
	$: {
		currentPage;
		getFilteredTable(
			$status.completeColumns,
			$selectionPredicates,
			$zenoState,
			[start, end]
		).then((res) => (table = res));
	}

	onMount(() => {
		try {
			import(window.location.origin + "/cache/view.mjs").then((m) => {
				viewFunction = m.getInstance;
				if (m.getOptions) {
					m.getOptions(optionsDiv, (opts) => (viewOptions = opts));
				}
			});
		} catch (e) {
			console.log("ERROR: failed to load sample view ---", e);
		}
	});

	$: if (viewFunction) {
		table;
		$sort;
		viewOptions;
		drawInstances();
	}

	async function drawInstances() {
		let obj = $status.completeColumns.find((c) => {
			return (
				c.columnType === ZenoColumnType.OUTPUT &&
				c.name === $model &&
				c.transform === $transform
			);
		});
		let modelColumn = obj ? columnHash(obj) : "";
		let transformColumn = "";
		if ($zenoState.transform) {
			let col = <ZenoColumn>{
				columnType: ZenoColumnType.TRANSFORM,
				name: $zenoState.transform,
			};
			transformColumn = columnHash(col);
		}

		await tick();

		let ids = table.map((inst) => inst[idHash]);
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
					transformColumn,
					idHash
				);
			}
		});
	}
</script>

{#if table}
	<SelectionBar />
	<div bind:this={optionsDiv} />
	<div class="container sample-container">
		{#each table as inst (inst[idHash])}
			<div bind:this={viewDivs[inst[idHash]]} />
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
			{start + 1}-{end} of {$settings.totalSize}
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
	.sample-container {
		width: 100%;
		height: calc(100vh - 241px);
		overflow-y: auto;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
		display: flex;
		flex-wrap: wrap;
	}
</style>
