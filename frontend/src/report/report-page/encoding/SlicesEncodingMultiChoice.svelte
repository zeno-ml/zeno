<script lang="ts">
	import { folders, report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";
	import { dndzone } from "svelte-dnd-action";

	export let secondSlice = false;

	let options = [];
	let value = [];
	let folder = "-- Select Folder --";
	let refresh = 0;

	// initial options & values
	[...$slices.keys()].forEach((s, i) => {
		options[i] = { value: i, label: s };
	});
	let initialSlices = secondSlice
		? $reports[$report].parameters.secondSlices
		: $reports[$report].slices;
	initialSlices.forEach((s, i) => {
		value[i] = options.find((o) => o.label === s).value;
	});

	function updateReportSlices(slices) {
		if (secondSlice) {
			$reports[$report].parameters.secondSlices = slices;
		} else {
			$reports[$report].slices = slices;
		}
	}

	function updateDragOrder(val) {
		// check if all elements are numbers (dndzone's place holder)
		if (!val.some((i) => !Number.isInteger(i))) {
			let tmp = [];
			// align by drag order
			val.forEach((v, i) => {
				tmp[i] = options[v].label;
			});
			updateReportSlices(tmp);
		}
	}

	$: updateDragOrder(value);
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		bind:value={folder}
		options={["-- Select Folder --", ...$folders.values()]}
		labelAsValue
		placeholder="Select Folder..."
		on:change={(e) => {
			if (e.detail && e.detail.label !== "-- Select Folder --") {
				let sls = [...$slices.values()]
					.filter((s) => s.folder === e.detail.label)
					.map((s) => s.sliceName);
				value = [];
				sls.forEach((s, i) => {
					value[i] = options.find((o) => o.label === s).value;
				});
				updateReportSlices(sls);
				refresh++;
			}
		}} />
</div>

{#key refresh}
	<div class="parameters">
		<h4 class="select-label">&nbsp;</h4>
		<Svelecte
			style="width: 280px; flex:none;"
			bind:value
			{options}
			{dndzone}
			multiple
			on:change={(e) => {
				let s = [];
				e.detail.forEach((ed) => {
					s.push(ed.label);
				});
				updateReportSlices(s);
			}}
			placeholder="Select Slices..." />
	</div>
{/key}

<style>
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.select-label {
		margin: 5px;
	}

	:global(#dnd-action-dragged-el .sv-item) {
		--sv-item-selected-bg: var(--P3);
		--sv-item-btn-bg: var(--P3);
	}
	:global(div[role="listitem"]) {
		outline: none;
	}
</style>
