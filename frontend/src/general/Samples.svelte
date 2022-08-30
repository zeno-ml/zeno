<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";

	import { desc } from "arquero";

	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";

	import { ZenoColumnType } from "../globals";
	import { columnHash } from "../util/util";
	import {
		model,
		sort,
		settings,
		status,
		transform,
		rowsPerPage,
	} from "../stores";
	import SelectionBar from "../metadata/SelectionBar.svelte";

	export let table: ColumnTable;

	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

	let currentPage = 0;
	let end = 0;
	let lastPage = 0;

	let modelColumn = "";
	let transformColumn = "";

	let sampleDiv;
	let divFunction;

	$: start = currentPage * $rowsPerPage;

	$: if (table) {
		end = Math.min(start + $rowsPerPage, table.size);
	}
	$: if (table) {
		lastPage = Math.max(Math.ceil(table.size / $rowsPerPage) - 1, 0);
	}
	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	status.subscribe((s) => {
		let obj = s.completeColumns.find((c) => {
			return (
				c.columnType === ZenoColumnType.OUTPUT &&
				c.name === $model &&
				c.transform === $transform
			);
		});
		modelColumn = obj ? columnHash(obj) : "";
	});

	transform.subscribe((t) => {
		if (t) {
			let col = <ZenoColumn>{
				columnType: ZenoColumnType.TRANSFORM,
				name: t,
			};
			transformColumn = columnHash(col);
		} else {
			transformColumn = "";
		}
	});

	$: if (sampleDiv && divFunction) {
		sampleDiv.innerHTML = "";
		let sampleTable = table;
		if ($sort) {
			sampleTable = sampleTable.orderby(desc(columnHash($sort)));
		}
		sampleTable = sampleTable.slice(start, end);

		sampleDiv.appendChild(
			divFunction(
				sampleTable.objects(),
				modelColumn,
				columnHash($settings.labelColumn),
				columnHash($settings.dataColumn),
				transformColumn,
				columnHash($settings.idColumn)
			)
		);
	}

	settings.subscribe(() => {
		let v = window.location.origin + "/view/index.mjs";
		try {
			import(v).then((m) => (divFunction = m.default));
		} catch (e) {
			console.log("ERROR: failed to load sample view ---", e);
		}
	});
</script>

{#if table}
	<SelectionBar />
	<div class="container sample-container">
		<div bind:this={sampleDiv} />
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
			{start + 1}-{end} of {table.size}
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
		height: calc(100vh - 240px);
		overflow-y: auto;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
	}
</style>
