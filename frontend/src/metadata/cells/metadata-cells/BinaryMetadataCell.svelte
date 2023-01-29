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
	<div style:display="flex">
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
			<p>{histogram[0].filteredCount}</p>
		</div>
		<div class="binary-button">
			<Button
				variant={selectedValue !== null && !selectedValue
					? "unelevated"
					: "outlined"}
				on:click={() => setSelection(false)}>
				<Label>False</Label>
			</Button>
			<p>{histogram[1].filteredCount}</p>
		</div>
	</div>
{/if}

<style>
	p {
		padding: 0px;
		margin: 0px;
		font-size: 14px;
		color: #666;
	}
	.binary-button {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
