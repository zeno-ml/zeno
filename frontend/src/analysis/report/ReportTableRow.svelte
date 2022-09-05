<script lang="ts">
	import { Cell, Row } from "@smui/data-table";
	import { Svg } from "@smui/common/elements";
	import { Icon } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";
	import IconButton from "@smui/icon-button";
	import { mdiPencilOutline, mdiDotsHorizontal } from "@mdi/js";

	import { getMetricsForSlices } from "../../util/util";
	import { models, slices, reports, report } from "../../stores";

	import SliceDetailsContainer from "../SliceDetailsContainer.svelte";
	import SparkLine from "../SparkLine.svelte";

	export let predicateIndex: number;
	export let predicate: ReportPredicate;

	let editMode = false;
	let hovering = false;
	let showOptions = false;

	$: sli = $slices.get(predicate.sliceName);

	let modelResults = [];
	$: getMetricsForSlices(
		$models.map((m) => ({
			sli: sli,
			metric: predicate.metric,
			model: m,
			transform: predicate.transform,
		}))
	).then((arr) => (modelResults = arr));

	function savePredicates() {
		// Exiting edit mode, save predicates and update results.
		let outcomes = modelResults.map((res) => {
			if (predicate.operation && predicate.value) {
				if (eval(`${res} ${predicate.operation} ${predicate.value}`)) {
					return 1;
				} else {
					return 0;
				}
			}
			return 1;
		});
		let rep = $reports[$report];
		rep.reportPredicates[predicateIndex].results = outcomes;
		reports.update((reps) => {
			reps[$report] = rep;
			return reps;
		});
	}
</script>

<Row
	style="overflow: visible"
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}>
	<Cell class="sticky" style="left: 0px; border-right: 1px solid #e8e8e8">
		<div class="inline">
			{#if sli}
				<SliceDetailsContainer {sli} />
			{/if}
			<div class="group">
				<div style:width="36px">
					{#if hovering}
						<IconButton
							size="button"
							style="padding: 0px"
							on:click={(e) => {
								e.stopPropagation();
								showOptions = !showOptions;
							}}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiDotsHorizontal} />
							</Icon>
						</IconButton>
					{/if}
				</div>

				{#if showOptions}
					<div
						id="options-container"
						on:mouseleave={() => (showOptions = false)}
						on:blur={() => (showOptions = false)}>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								if (editMode) {
									savePredicates();
								}
								editMode = !editMode;
							}}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiPencilOutline} />
							</Icon>
						</IconButton>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								let rep = $reports[$report];
								rep.reportPredicates.splice(predicateIndex, 1);
								reports.update((reps) => {
									reps[$report] = rep;
									return reps;
								});
							}}>
							<Icon class="material-icons">delete_outline</Icon>
						</IconButton>
					</div>
				{/if}
			</div>
		</div>
	</Cell>
	<Cell style="overflow: visible">
		{#if editMode}
			<Select
				bind:value={predicate.operation}
				label="Operation"
				style="margin-right: 20px; margin-left: 20px; width: 120px">
				{#each [">", "<", "==", "!="] as o}
					<Option value={o}>{o}</Option>
				{/each}
			</Select>
			<Textfield style="width: 50px" bind:value={predicate.value} label="Value">
				<HelperText slot="helper">0</HelperText>
			</Textfield>
		{:else}
			{predicate.operation} {predicate.value}
		{/if}
	</Cell>
	<Cell style="left: 100px">{predicate.transform}</Cell>
	<Cell>{predicate.metric}</Cell>
	{#if $models.length > 2 && modelResults.length > 0}
		<Cell class="end-cell"><SparkLine res={modelResults} /></Cell>
	{/if}
	{#each modelResults as r, i}
		<Cell>
			<p
				style={predicate.results[i] === undefined || predicate.results[i] === 1
					? "color: black"
					: "color: #b71c1c; font-weight: 500"}>
				{r ? r.toFixed(2) : ""}
			</p>
		</Cell>
	{/each}
</Row>

<style>
	.inline {
		display: flex;
		align-items: center;
	}
	:global(.sticky) {
		overflow: visible;
		left: 0px;
		background: white;
		z-index: 0;
	}
	#options-container {
		z-index: 5;
		background: white;
		margin-top: -1px;
		border: 1px solid #e8e8e8;
		position: absolute;
		height: max-content;
		display: flex;
	}
	.group {
		margin-left: 10px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
</style>
