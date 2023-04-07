<script lang="ts">
	import Paper from "@smui/paper";
	import { fade } from "svelte/transition";
	import { Label } from "@smui/common";
	import Chip from "@smui/chips";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { clickOutside } from "../../util/clickOutside";
	import { mdiPlus, mdiClose } from "@mdi/js";
	import { Pagination } from "@smui/data-table";
	import { settings, showSliceFinder } from "../../stores";
	import { ZenoService } from "../../zenoservice";
	import { model } from "../../stores";

	let currentResult;
	let currentPage = 1;
	let input;
	let slice_data = [];
	let sampleOptions = [5, 15, 30, 60, 100, $settings.samples].sort(
		(a, b) => a - b
	);
	// dummy data for presenting frontend UI
	let minimumSizes = ["10", "20", "30", "50"];
	let minimumSize = "10";
	let depths = ["10", "20", "30", "50"];
	let depth = "10";
	let sliceFinderMetrics = ["accuracy", "f1", "recall"];
	let sliceFinderMetric = "accuracy";
	let orderBys = ["ascending", "descending"];
	let orderBy = "ascending";

	$: start = 0;
	$: end = 10000;
	$: lastPage = 10000;
	$: if (showSliceFinder && input) {
		input.getElement().focus();
	}

	export async function testPOSTAbility() {
		const sets = await ZenoService.projectFindAvailableSlices({
			id: "1",
			orderBy: orderBy,
			sliceFinderMetric: sliceFinderMetric,
			minimumSize: minimumSize,
			depth: depth,
			model: $model,
		});
		console.log(sets)
	}

	function submit(e) {
		if ($showSliceFinder && e.key === "Escape") {
			$showSliceFinder = false;
		}
	}

	function slice_data_generator() {
		let predicateList = [
			"brightness > 100",
			"blue_count > 2",
			"number_of_cats > 5",
			"number_of_bugs < 1",
			"number_of_rabbits == 11",
		];
		for (let i = 0; i < 5; i++) {
			let predicate = [];
			predicate.push(
				predicateList[Math.floor(Math.random() * predicateList.length)]
			);
			predicate.push(
				predicateList[Math.floor(Math.random() * predicateList.length)]
			);
			predicate.push(
				predicateList[Math.floor(Math.random() * predicateList.length)]
			);
			let data = {
				predicate: predicate,
				number_1: Math.floor(Math.random() * 180),
				number_2: Math.floor(Math.random() * 10) / 10,
			};
			slice_data.push(data);
		}
	}
	slice_data_generator();
</script>

<svelte:window on:keydown={submit} />
{#if showSliceFinder}
	<div class="coverage" transition:fade />
{/if}
<div
	id="slice-finder-container"
	style="justify-content: flex-start;"
	transition:fade
	use:clickOutside
	on:click_outside={() => ($showSliceFinder = false)}>
	<Paper elevation={7}>
		<div class="inline">
			<h4 class="title">SUGGESTED SLICES</h4>
			<IconButton on:click={() => ($showSliceFinder = false)}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#6a1b9a" d={mdiClose} />
				</Icon>
			</IconButton>
			<IconButton on:click={() => testPOSTAbility()}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#6a1b9a" d={mdiClose} />
				</Icon>
			</IconButton>
		</div>
		<div class="metrics">
			<Select
				class="select"
				bind:value={minimumSize}
				label="Minimum Size"
				style="width: 170px">
				{#each minimumSizes as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={depth}
				label="Depth"
				style="width: 170px">
				{#each depths as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={sliceFinderMetric}
				label="Metric"
				style="width: 170px">
				{#each sliceFinderMetrics as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={orderBy}
				label="Order By"
				style="width: 170px">
				{#each orderBys as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			{#each slice_data as element}
				<div class="allSlices">
					{#each element.predicate as pred}
						<Chip bind:chip={pred} class="label meta-chip"
							><Label>
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
					<span class="rightElement" style="margin-top:10px;"
						>{"" + element.number_2 * 100 + "%"}</span>
					<span class="rightElement" style="margin-top:10px;color:gray;"
						>{"(" + element.number_1 + ")"}</span>
				</div>
			{/each}
		</div>
		<Pagination>
			<svelte:fragment slot="rowsPerPage">
				<Label>Rows Per Page</Label>
				<Select variant="outlined" noLabel>
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
		background: rgba(0, 0, 0, 0.3);
		width: 500vw;
		height: 500vh;
		margin-left: -100vw;
		margin-top: -100vh;
		z-index: 1;
	}
	.metrics :global(.label) {
		background-color: rgba(230, 222, 237, 1);
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
		background: rgba(230, 222, 237, 1);
		border: 1px solid #e8e8e8;
		margin-left: 10px;
		margin-right: 10px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
