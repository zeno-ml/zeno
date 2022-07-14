<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";

	import { ZenoColumnType } from "../globals";
	import { columnHash } from "../util";
	import { model, settings, status, transform } from "../stores";

	export let table;

	let rowsPerPage = 60;
	let currentPage = 0;

	let modelColumn = "";

	status.subscribe((s) => {
		let obj = s.completeColumns.find((c) => {
			return c.columnType === ZenoColumnType.OUTPUT && c.name === $model;
		});
		modelColumn = obj ? columnHash(obj) : "";
	});

	$: start = currentPage * rowsPerPage;
	let end = 0;
	let lastPage = 0;

	$: if (table) {
		end = Math.min(start + rowsPerPage, table.size);
	}
	$: if (table) {
		lastPage = Math.max(Math.ceil(table.size / rowsPerPage) - 1, 0);
	}

	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	let transformColumn = "";
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

	let sampleDiv;
	let divFunction;

	$: if (sampleDiv && divFunction) {
		sampleDiv.innerHTML = "";
		sampleDiv.appendChild(
			divFunction(
				table.slice(start, end).objects(),
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
			console.log(e);
		}
	});
</script>

{#if table}
	<div class="container sample-container">
		<div bind:this={sampleDiv} />
	</div>
	<Pagination slot="paginate" class="pagination">
		<svelte:fragment slot="rowsPerPage">
			<Label>Rows Per Page</Label>
			<Select variant="outlined" bind:value={rowsPerPage} noLabel>
				<Option value={15}>15</Option>
				<Option value={30}>30</Option>
				<Option value={60}>60</Option>
				<Option value={100}>100</Option>
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
		height: calc(100vh - 260px);
		overflow-y: auto;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
	}
</style>
