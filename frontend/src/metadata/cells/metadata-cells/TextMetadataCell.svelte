<script lang="ts">
	import Textfield from "@smui/textfield";
	import Button from "@smui/button";
	import { Label } from "@smui/common";
	import { TrailingIcon } from "@smui/chips";
	import type { FilterPredicate, ZenoColumn } from "../../../zenoservice";

	export let col: ZenoColumn;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let regex = "";
	let valid = true;

	$: {
		valid = true;
		try {
			new RegExp(regex);
		} catch (e) {
			valid = false;
		}
	}

	function setSelection() {
		filterPredicates.push({
			column: col,
			operation: "match",
			value: regex,
			join: "|",
		});
		updatePredicates(filterPredicates);
	}
</script>

<div class="container">
	<Textfield bind:value={regex} label="Regex filter" />

	<Button style="margin-left: 10px;" variant="outlined" on:click={setSelection}>
		<Label>Set</Label>
	</Button>
	{#if !valid}
		<p style="margin-right: 10px; color: #B71C1C">Invalid regex</p>
	{/if}
	<p />
	<br />
</div>
<div class="chips">
	{#each filterPredicates as pred}
		<div class="meta-chip">
			<span>
				{pred.value}
			</span>
			<TrailingIcon
				class="remove material-icons"
				on:click={() => {
					filterPredicates = filterPredicates.filter((p) => p !== pred);
					updatePredicates(filterPredicates);
				}}>
				cancel
			</TrailingIcon>
		</div>
	{/each}
</div>

<style>
	.container {
		display: flex;
		align-items: end;
		margin-left: 5px;
	}
	.chips {
		display: flex;
		flex-direction: inline;
		flex-wrap: wrap;
		height: fit-content;
		align-items: center;
		padding-bottom: 5px;
		padding-top: 5px;
	}
	.meta-chip {
		padding: 5px 10px;
		background: var(--P3);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
