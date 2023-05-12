<script lang="ts">
	import Paper from "@smui/paper";
	import { fade } from "svelte/transition";
	import { Label } from "@smui/common";
	import Chip from "@smui/chips";
	import { Svg } from "@smui/common";
	import { selections, showNewSlice, slices, sliceToEdit } from "../../stores";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import { clickOutside } from "../../util/clickOutside";
	import { mdiPlus, mdiClose } from "@mdi/js";
	import { showSliceFinder } from "../../stores";
	import { model, metric } from "../../stores";
	import Button from "@smui/button";
	import { getMetricsForSlices } from "../../api/slice";
	import { ZenoService, type MetricKey } from "../../zenoservice";

	let slice_data = [];
	// dummy data for presenting frontend UI
	let minimumSizes = ["2", "3", "4", "5", "6", "7"];
	let minimumSize = "5";
	let max_ls = ["4", "5", "6", "7", "8"];
	let max_l = "5";
	let sliceFinderKeys = ["data"];
	let sliceFinderKey = "data";
	let orderBys = ["ascending", "descending"];
	let orderBy = "ascending";
	let sets;
	$: dataframeKeyValuePair = {};
	$: sliceFinderMessage = "";

	export async function addSliceAtIndex(index) {
		let slice = sets.slices_of_interest[index];

		ZenoService.createNewSlice(slice).then(() => {
			slices.update((s) => {
				s.set(slice.sliceName, slice);
				return s;
			});
			selections.update((sels) => ({ slices: [], metadata: sels.metadata }));
			showNewSlice.set(false);
			sliceToEdit.set(null);
		});
	}

	export async function activateSliceFinder() {
		sliceFinderMessage = "Generating Slices...";
		sets = await ZenoService.projectFindAvailableSlices({
			id: "1",
			order_by: orderBy,
			minimum_size: minimumSize,
			depth: max_l,
			model: $model,
			column_name: sliceFinderKey,
		});
		let all_metrics = [];
		for (let i = 0; i < sets.slices_of_interest.length; i++) {
			let curr_slice = sets.slices_of_interest[i];
			let curr_metric = await getMetricsForSlices([
				<MetricKey>{
					sli: curr_slice,
					model: $model,
					metric: $metric,
				},
			]);
			all_metrics.push(curr_metric);
		}
		sliceFinderMessage = "";
		slice_data_generator(
			sets.list_of_trained_elements,
			sets.slices_of_interest,
			all_metrics
		);
	}

	function submit(e) {
		if ($showSliceFinder && e.key === "Escape") {
			$showSliceFinder = false;
		}
	}

	export async function get_all_valid_columns() {
		dataframeKeyValuePair = await ZenoService.getColumnsWithSummary();
		sliceFinderKeys = Object.keys(dataframeKeyValuePair);
		sliceFinderKeys = sliceFinderKeys;
	}

	function slice_data_generator(
		predicateList = [],
		slices_of_interest = [],
		all_metrics = []
	) {
		// demo page
		slice_data = [];
		if (predicateList.length === 0) {
			predicateList = [
				"Welcome to the Slice Finder Screen! Click on the Button on the upperright corner to begin!",
			];
			let predicate = [];
			predicate.push(predicateList[0]);
			let data = {
				predicate: predicate,
				slice_size: 0,
				accuracy_rate: 0,
				index: 0,
			};
			slice_data.push(data);
		} else {
			slice_data = [];
			slices_of_interest.forEach((element, i) => {
				let predicate = [];
				let predicates_store = element.filterPredicates.predicates;
				for (let k = 0; k < predicates_store.length; k++) {
					predicate.push(
						predicates_store[k].column.name +
							predicates_store[k].operation +
							predicates_store[k].value
					);
				}
				let data = {
					predicate: predicate,
					slice_size: all_metrics[i][0].size,
					accuracy_rate: all_metrics[i][0].metric,
					index: i,
				};
				slice_data.push(data);
			});

			if (orderBy === "descending") {
				slice_data.reverse();
			}
		}
	}

	get_all_valid_columns();
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
				bind:value={max_l}
				label="Max Lattice Level"
				style="width: 170px">
				{#each max_ls as m}
					<Option value={m}>{m}</Option>
				{/each}
			</Select>
			<Select
				class="select"
				bind:value={sliceFinderKey}
				label="Metric Column 1"
				style="width: 170px">
				{#each sliceFinderKeys as m}
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

			<Button on:click={() => activateSliceFinder()}>Generate Slices</Button>
			<span id="generate-slices">{sliceFinderMessage}</span>

			{#each slice_data as element}
				<div class="allSlices">
					{#each element.predicate as pred}
						<Chip bind:chip={pred} class="label meta-chip"
							><Label>
								{pred}
							</Label></Chip>
					{/each}
					<span>
						<IconButton
							class="rightElement"
							style="margin-top:-6px;"
							on:click={() => addSliceAtIndex(element.index)}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="#6a1b9a" d={mdiPlus} />
							</Icon>
						</IconButton>
					</span>
					<span class="rightElement" style="margin-top:10px;color:gray;"
						>{"(" + element.slice_size + ")"}</span>
					<span class="rightElement" style="margin-top:10px;"
						>{"" + Math.round(element.accuracy_rate * 100) / 100.0 + "%"}</span>
				</div>
			{/each}
		</div>
	</Paper>
</div>

<style>
	#slice-finder-container {
		position: fixed;
		top: 8vh;
		margin-left: 10vw;
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
		z-index: 9;
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
