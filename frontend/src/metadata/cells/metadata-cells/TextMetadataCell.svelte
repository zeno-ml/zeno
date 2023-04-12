<script lang="ts">
	import Button from "@smui/button";
	import { TrailingIcon } from "@smui/chips";
	import { Label } from "@smui/common";
	import AutoComplete from "simple-svelte-autocomplete";
	import {
		ZenoService,
		type FilterPredicate,
		type ZenoColumn,
	} from "../../../zenoservice";

	export let col: ZenoColumn;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let regex = "";
	let selectionType = "string";
	let valid = true;

	$: {
		valid = true;
		if (selectionType === "regex") {
			try {
				new RegExp(regex);
			} catch (e) {
				valid = false;
			}
		}
	}

	function setSelection() {
		filterPredicates.push({
			column: col,
			operation: "match",
			value: regex,
			join: "",
		});
		if (filterPredicates.length > 1) {
			filterPredicates[filterPredicates.length - 1].join = "|";
		}
		updatePredicates(filterPredicates);
		regex = "";
	}

	async function searchItems(input: string) {
		if (selectionType === "regex") {
			try {
				new RegExp(regex);
			} catch (e) {
				return [];
			}
		}

		try {
			let res = await ZenoService.filterStringMetadata({
				column: col,
				filterString: input,
				selectionType: selectionType,
			});

			return res;
		} catch (e) {
			return [];
		}
	}
</script>

<div class="container">
	<AutoComplete
		bind:text={regex}
		placeholder={"Search"}
		noResultsText={"No results"}
		hideArrow={true}
		searchFunction={searchItems}
		showLoadingIndicator={true}
		cleanUserText={false}
		ignoreAccents={false}
		localFiltering={false}
		delay={200} />
	<div id="options">
		<div
			class="option option-left"
			style:background={selectionType === "string" ? "var(--G5)" : ""}
			on:keydown={() => ({})}
			on:click={() => (selectionType = "string")}>
			abc
		</div>
		<div
			class="option option-right"
			style:background={selectionType === "regex" ? "var(--G5)" : ""}
			on:keydown={() => ({})}
			on:click={() => (selectionType = "regex")}>
			.*
		</div>
	</div>

	<Button style="margin-left: 10px;" variant="outlined" on:click={setSelection}>
		<Label>Set</Label>
	</Button>
	<p />
</div>
{#if !valid}
	<p style="margin-right: 10px; color: #B71C1C">Invalid regex</p>
{/if}
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
					if (filterPredicates.length > 0) {
						filterPredicates[0].join = "";
					}
					updatePredicates(filterPredicates);
				}}>
				cancel
			</TrailingIcon>
		</div>
	{/each}
</div>

<style>
	#options {
		display: flex;
		flex-direction: row;
		margin-left: 10px;
	}
	.option {
		padding: 6px 10px;
		border: 0.5px solid var(--G4);
		width: fit-content;
		cursor: pointer;
	}
	.option:hover {
		background: var(--G4);
	}
	.option-left {
		margin-right: -1px;
		border-radius: 5px 0px 0px 5px;
		border-right: 1px solid var(--G4);
	}
	.option-right {
		border-radius: 0px 5px 5px 0px;
	}
	.container {
		display: flex;
		align-items: center;
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
