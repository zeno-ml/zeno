<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
    import { fade } from 'svelte/transition'
    import { Label } from "@smui/common";
    import Chip from "@smui/chips";
	import Textfield from "@smui/textfield";
    import { Svg } from "@smui/common";
    import IconButton, { Icon } from "@smui/icon-button";
    import Select, { Option } from "@smui/select";
	import { clickOutside } from "../../util/clickOutside";
	import { mdiFolderPlusOutline, mdiPlus, mdiClose, mdiPlusCircle, mdiWifiPlus } from "@mdi/js";
    import { Pagination } from "@smui/data-table";
	import {
		folders,
		metric,
		metricRange,
		metrics,
		model,
		models,
		selectionIds,
		selectionPredicates,
		selections,
		settings,
        rowsPerPage,
		showNewSlice,
		slices,
		sliceToEdit,
		requestingHistogramCounts,
		status,
	} from "../../stores";
	export let edit = false;
	export let showSliceFinder;
	export let folderName = "";

	let input;
	let originalFolderName = folderName;

	$: invalidName =
		($folders.includes(folderName) && folderName !== originalFolderName) ||
		folderName.length === 0;

	$: if (showSliceFinder && input) {
		input.getElement().focus();
	}

	function createFolder() {
		if (edit) {
			folders.update((f) => {
				f.splice(f.indexOf(originalFolderName), 1);
				f.push(folderName);
				slices.update((slis) => {
					[...slis.keys()].forEach((sliKey) => {
						let s = slis.get(sliKey);
						if (s.folder === originalFolderName) {
							s.folder = folderName;
							slis.set(sliKey, s);
						}
					});
					return slis;
				});
				return f;
			});
		} else {
			folders.update((f) => {
				f.push(folderName);
				folderName = "";
				return [...f];
			});
		}
		showSliceFinder = false;
	}

	function submit(e) {
		if (showSliceFinder && e.key === "Escape") {
			showSliceFinder = false;
		}
		if (showSliceFinder && e.key === "Enter") {
			//createFolder();
		}
	}
	/*
		{#if invalidName && folderName.length > 0}
			<p style:margin-right="10px" style:color="#B71C1C">
				folder already exists
			</p>
		{/if}background: rgba(0,0,0,0.50);
	*/

    let slice_data = [];
    let clicked = 0;
    function slice_data_generator() {
        let predicateList = ["brightness > 100", 
                            "blue_count > 2", 
                            "number_of_cats > 5", 
                            "number_of_bugs < 1",
                            "number_of_rabbits == 11"];
        for(let i = 0; i < 5; i++) {
            let predicate = [];
            predicate.push(predicateList[Math.floor(Math.random() * predicateList.length)]);
            predicate.push(predicateList[Math.floor(Math.random() * predicateList.length)]);
            predicate.push(predicateList[Math.floor(Math.random() * predicateList.length)]);
            let data = {
                predicate: predicate,
                number_1: Math.floor(Math.random() * 180),
                number_2: Math.floor(Math.random() * 10) / 10,
            }
            slice_data.push(data);
        }
    }
    slice_data_generator();

    $: idHash = 12; //columnHash($settings.idColumn);
	$: start = 0;//currentPage * $rowsPerPage;
	$: end = 10000; //Math.min(start + $rowsPerPage, $settings.totalSize);
	$: lastPage = 10000; //Math.max(Math.ceil($settings.totalSize / $rowsPerPage) - 1, 0);
    /*
	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}
    */
    let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);

    let currentResult;

    let currentPage = 1;


</script>

<svelte:window on:keydown={submit} />
{#if showSliceFinder}
<div class="coverage" 
transition:fade>
</div>
{/if}
<div
	id="slice-finder-container"
    transition:fade
	use:clickOutside
	on:click_outside={() => (showSliceFinder = false)}>
	<Paper elevation={7}>
        <div class="inline">
            <h4 class="title">SUGGESTED SLICES</h4>
            <IconButton on:click={() => (showSliceFinder = false)}>
                <Icon component={Svg} viewBox="0 0 24 24">
                    <path fill="#6a1b9a" d={mdiClose} />
                </Icon>
            </IconButton>
        </div>
        <div class="metrics">
            <Select class="select" bind:value={$metric} label="Metric" style="width: 170px">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
            <Select class="select" bind:value={$metric} label="Metric" style="width: 170px">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
            <Select class="select" bind:value={$metric} label="Metric" style="width: 170px">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
            <Select class="select" bind:value={$metric} label="Metric" style="width: 170px">
				{#each $metrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
            {#each slice_data as element}
                <div class="allSlices">
                    {#each element.predicate as pred}
                        <Chip bind:chip={pred} class="label meta-chip"><Label>
                            {pred}
                        </Label></Chip>
                    {/each}
                <span>
                    <IconButton class="rightElement" style="margin-top:-6px;">
                        <Icon component={Svg} viewBox="0 0 24 24">
                            <path fill="#6a1b9a" d={mdiPlus} />
                        </Icon>
                    </IconButton>
                </span>
                <span class="rightElement" style="margin-top:10px;">{"" + element.number_2 * 100 + "%"}</span>
                <span class="rightElement" style="margin-top:10px;color:gray;">{"(" + element.number_1 + ")"}</span>
                </div>
            {/each}
        </div>
        <Pagination>
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
	</Paper>
</div>

<style>
	#slice-finder-container {
		position: fixed;
        top: 8vh;
        z-index: 10;
        min-width: 70vw;
	}
    .title {
        text-align: left;
        padding-left: 20px;
    }
    .inline {
        display: flex;
        justify-content: space-between;
    }
    .metrics {
        justify-content: space-between;
    }
    .metrics :global(.select) {
        margin-left: 20px;
        padding-right: 15px;
    }
    .coverage {
        position: fixed;
        background: rgba(0,0,0,0.30);
        width: 500vw;
        height: 500vh;
        margin-left: -100vw;
        margin-top: -100vh;
        z-index: 1;
    }
    .metrics :global(.label) {
        background-color: rgba(230,222,237,1);
        color: black;
        margin-left: 20px;
    }
    .metrics :global(.rightElement) {
        align-items: baseline;
        float: right;
        margin-right: 25px;
    }
    .allSlices {
        margin-top: 10px;
        margin-bottom: 10px;
        justify-content: space-between;
    }
    .metrics :global(.meta-chip) {
		padding: 5px;
		background: rgba(230,222,237,1);
		border: 1px solid #e8e8e8;
		margin-left: 10px;
		margin-right: 10px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
