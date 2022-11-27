<script lang="ts">
	import { Label } from "@smui/button";
	import { Pagination } from "@smui/data-table";
    import { Icon } from "@smui/button";
	import IconButton from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import SelectionBar from "../metadata/SelectionBar.svelte";
	import { tick } from "svelte";
	import { ZenoColumnType } from "../globals";
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
	export let viewFunction;
	export let viewOptions = {};

    let columnHeader = [];

    let sortingStatus = {};

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
			[start, end],
			[$sort, true]
		).then((res) => (table = res));
	}

	$: if (viewFunction) {
		table;
		$sort;
		viewOptions;
		drawInstances();
	}

    enum SortType {
        ASCENDING,
        DESCENDING,
        NONE
    }


    function populateSortingRecord() {
        for(let i = 0; i < $status.completeColumns.length; i++) {
                sortingStatus[$status.completeColumns[i].name] = SortType.NONE;
        }
    }


    function sort_row(column_name) {
        // re-populate the record
        // find the column
        let correctColumnNum = 0;
        for(let i = 0; i < $status.completeColumns.length; i++) {
            if($status.completeColumns[i].name == column_name) {
                correctColumnNum = i;
                break;
            }
        }

        console.log(correctColumnNum);

        let correctColumn = $status.completeColumns[correctColumnNum];
        let current_status = sortingStatus[column_name];

        populateSortingRecord();

        if(current_status == SortType.DESCENDING) {
            sortingStatus[column_name] = SortType.NONE;
	    	getFilteredTable(
		    	$status.completeColumns,
			    $selectionPredicates,
    			$zenoState,
	    		[start, end],
		    	[$sort, true]
		    ).then((res) => (table = res));
        }else if(current_status == SortType.ASCENDING) {
            sortingStatus[column_name] = SortType.DESCENDING;
            getFilteredTable(
                $status.completeColumns,
		    	$selectionPredicates,
			    $zenoState,
    			[start, end],
                [correctColumn, true]
		    ).then((res) => (table = res));
        }else if(current_status == SortType.NONE) {
            sortingStatus[column_name] = SortType.ASCENDING;
            getFilteredTable(
                $status.completeColumns,
		    	$selectionPredicates,
			    $zenoState,
    			[start, end],
                [correctColumn, false]
		    ).then((res) => (table = res));
        }
    }

    populateSortingRecord();
    
    // function reuse to improve readability.
	async function drawInstances() {
		let tempTable = table;
		tempTable = tempTable.slice(start, end);

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
	// console.log($transform);
</script>

{#if table}
    <!--<SelectionBar />-->
	<!--<<div bind:this={optionsDiv} />-->
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
                            <Icon class="material-icons" style="font-size: 1em; padding-top:3px" on:click={() => (sort_row(header.name))}>
                                {#if sortingStatus[header.name] == SortType.NONE}
                                keyboard_control
                                {/if}
                                {#if sortingStatus[header.name] == SortType.ASCENDING}
                                keyboard_arrow_down
                                {/if}
                                {#if sortingStatus[header.name] == SortType.DESCENDING}
                                keyboard_arrow_up
                                {/if}
                            </Icon>
                        </th>
                        {/if}
                    {/each}
                </tr>
              </thead>
            <tbody>
		        {#each table as tableContent}
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
		margin-left: 20px;
        margin-right: 20px;
        position: sticky; 
        top: 0;
        background-color: white;
        min-width:70px;
		font-size: 14px;
		margin-bottom: 5px;
		color: #666;
		padding-left: 1.60vw;
		padding-right: 1.60vw;
    }
	td {
		padding-left: 15px;
	}
</style>