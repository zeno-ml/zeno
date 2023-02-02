<script lang="ts">
	import Button from "@smui/button";
	import { Label } from "@smui/common";
	import type { FilterPredicate, ZenoColumn } from "../../../zenoservice";

	export let col: ZenoColumn;
	export let histogram;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	function setSelection(setting: boolean) {
		if (filterPredicates.length === 0) {
			filterPredicates = [
				{
					column: col,
					operation: "==",
					value: setting,
					join: "&",
				},
			];
		} else if (filterPredicates[0].value === setting) {
			filterPredicates = [];
		} else if (filterPredicates[0].value === true) {
			filterPredicates[0].value = false;
		} else {
			filterPredicates[0].value = true;
		}
		updatePredicates(filterPredicates);
	}

	$: selectedValue =
		filterPredicates.length > 0 ? filterPredicates[0].value : null;
</script>

{#if histogram}
	<div class="binary-button-wrapper">
		<div
			class="binary-button"
			style=" 'grey'
			: 'a'}">
			<Button
				variant={selectedValue !== null && selectedValue
					? "unelevated"
					: "outlined"}
				on:click={() => setSelection(true)}>
				<Label>True</Label>
			</Button>
			<small>{histogram[0].filteredCount}</small>
		</div>
		<div class="binary-button">
			<Button
				variant={selectedValue !== null && !selectedValue
					? "unelevated"
					: "outlined"}
				on:click={() => setSelection(false)}>
				<Label>False</Label>
			</Button>
			<small>{histogram[1].filteredCount}</small>
		</div>
	</div>
{/if}

<style>
	.binary-button {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.binary-button-wrapper {
		display: flex;
		gap: 5px;
	}
</style>
