<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";

	import { desc } from "arquero";

	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
    import { Icon } from "@smui/button";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";

	import { onMount, tick } from "svelte";
	import { ZenoColumnType } from "../globals";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	
	import {
		filteredTable,
		metadataSelections,
		model,
		rowsPerPage,
		settings,
		sort,
		status,
		transform,
	} from "../stores";
	import { columnHash } from "../util/util";

	export let table: ColumnTable;

	let instanceTable = [];
    let columnHeader = [];
	let viewFunction;
	let viewDivs = {};
	let optionsDiv;
	let modelColumn = "";
	let transformColumn = "";
	let viewOptions = {};

	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

	let currentPage = 0;
	let end = 0;
	let lastPage = 0;

    let rowTable = []

	$: idHash = columnHash($settings.idColumn);

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

	$: if ($status && $model) {
		let obj = $status.completeColumns.find((c) => {
			return (
				c.columnType === ZenoColumnType.OUTPUT &&
				c.name === $model &&
				c.transform === $transform
			);
		});
		modelColumn = obj ? columnHash(obj) : "";
	}

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
		metadataSelections.set(new Map());
	});

	$: if (viewFunction) {
		table;
		start;
		end;
		$sort;
		viewOptions;
		transformColumn;
		modelColumn;
		drawInstances();
	}

	$: console.log($filteredTable.objects());
	console.log($status.completeColumns);
	console.log(columnHash($status.completeColumns[0]));
    
    // function reuse to improve readability.
	async function drawInstances() {
		let tempTable = table;
		if ($sort) {
			tempTable = tempTable.orderby(desc(columnHash($sort)));
		}
		tempTable = tempTable.slice(start, end);
		instanceTable = tempTable.objects();

		await tick();
        columnHeader = $status.completeColumns;
	}
	// filteredTable is a store. to get value from store, use $before it.
	// filteredTable is not 
	// to get js objects, call .objects(), or .slice() to get a sample of it.
	// the last thing: $: anything after this update will refresh the statement
	// when refresh, the log should happen
	// status.completeColumns
	//$: console.log($filteredTable.objects());
	//console.log($status.completeColumns);
	//console.log(columnHash($status.completeColumns[0]));
	console.log($transform);
</script>

{#if table}
    <SelectionBar />
	<div bind:this={optionsDiv} />
	<div class="container sample-container">
        <table id="column-table">
            <thead>
                <tr>
                    {#each columnHeader as header}
						{#if header.name == "id"}
						<th>image</th>
						{/if}
					{/each}
					{#if $transform == "blur"}
						<th>blur</th>
					{/if}
					{#if $transform == "rotate"}
						<th>rotate</th>
					{/if}
					{#each columnHeader as header}
                        {#if header.columnType == 0 || header.columnType == 1 && header.name != "id"}
                        <th>{header.name}
                            {#if header.name == "label"}
                            <Icon class="material-icons" style="font-size: 1em; padding-top:3px">
                                keyboard_arrow_up
                            </Icon>
                            {/if}
                        </th>
                        {/if}
                    {/each}
                </tr>
              </thead>
            <tbody>
		        {#each instanceTable as tableContent}
                    <tr>
                        {#each columnHeader as header}
                            {#if header.name == "id"}
                            	<td><img alt="" src={"/data/" + tableContent["0id"]}/></td>
								{#if $transform == "blur"}
									<td><img alt="" src={"/cache/5blur/" + tableContent["5blur"]}/></td>
								{/if}
								{#if $transform == "rotate"}
									<td><img alt="" src={"/cache/5rotate/" + tableContent["5rotate"]}/></td>
								{/if}
                            {/if}
						{/each}
						{#each columnHeader as header}
                            {#if header.columnType == 0}
								<td>{tableContent[header.columnType + header.name]}</td>
							{/if}
							{#if header.columnType == 1}
                                <td>{Math.round(tableContent[header.columnType + header.name]) / 100 }</td>
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
		width: calc(100vw - 500px);
		height: calc(100vh - 241px);
		overflow-y: auto;
		align-content: baseline;
		border-bottom: 1px solid rgb(224, 224, 224);
		display: flex;
		flex-wrap: wrap;
        min-width:75px;
	}
    th {
        text-align: center;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
        margin-bottom: 20px;
        margin-right: 30px;
        position: sticky; 
        top: 0;
        background-color: white;
        min-width:70px;
		font-size: 14px;
		margin-left: 20px;
		margin-bottom: 5px;
		color: #666;
		padding-left: 1.60vw;
		padding-right: 1.60vw;
    }
	td {
		padding-left: 15px;
	}
</style>