<script lang="ts">
	import Button from "@smui/button";
	import { TrailingIcon } from "@smui/chips";
	import { Label } from "@smui/common";
	import AutoComplete from "simple-svelte-autocomplete";
	import MatchWholeWordIcon from "./static/MatchWholeWordIcon.svelte";
	import RegexIcon from "./static/RegexIcon.svelte";
	import {
		ZenoService,
		type FilterPredicate,
		type ZenoColumn,
	} from "../../../zenoservice";

	export let col: ZenoColumn;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let searchString = "";
	let selectionType = "string";
	let regexValid = true;
	let caseMatch = false;
	let wholeWordMatch = false;
	let refresh = 0;
	let noResultsText = "No results";

	$: {
		regexValid = true;
		if (selectionType === "regex") {
			try {
				new RegExp(searchString);
			} catch (e) {
				regexValid = false;
			}
		}
	}

	function setSelection() {
		filterPredicates.push({
			column: col,
			operation: "match",
			value: searchString,
			join: "",
		});
		if (filterPredicates.length > 1) {
			filterPredicates[filterPredicates.length - 1].join = "|";
		}
		updatePredicates(filterPredicates);
	}

	async function searchItems(input: string) {
		if (selectionType === "regex") {
			try {
				new RegExp(input);
				noResultsText = "No results";
			} catch (e) {
				noResultsText = "Invalid Regex!";
				return [];
			}
		}

		try {
			let res = await ZenoService.filterStringMetadata({
				column: col,
				filterString: input,
				selectionType: selectionType,
				caseMatch: caseMatch,
				wholeWordMatch: wholeWordMatch,
			});
			return res;
		} catch (e) {
			return [];
		}
	}

	function optionClick(e) {
		if (e.currentTarget instanceof HTMLElement) {
			let id = e.currentTarget.id;
			if (id === "caseMatch") {
				caseMatch = !caseMatch;
			} else if (id === "wholeWordMatch") {
				wholeWordMatch = !wholeWordMatch;
			} else {
				if (selectionType === "regex") {
					selectionType = "string";
					noResultsText = "No results";
					regexValid = true;
				} else {
					selectionType = "regex";
				}
			}
		}
		refresh++;
	}
</script>

<div class="container">
	<div class="search-bar">
		{#key refresh}
			<AutoComplete
				id="autoinput"
				bind:text={searchString}
				placeholder={"Search"}
				{noResultsText}
				hideArrow={true}
				searchFunction={searchItems}
				cleanUserText={false}
				ignoreAccents={false}
				localFiltering={false}
				delay={200}>
				<div slot="no-results" let:noResultsText>
					<span style:color={regexValid ? "" : "#B71C1C"}>{noResultsText}</span>
				</div>
			</AutoComplete>
		{/key}
		<div
			id="caseMatch"
			class="search-option"
			style:background={caseMatch ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}>
			Aa
		</div>
		<div
			id="wholeWordMatch"
			class="search-option"
			style:background={wholeWordMatch ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}>
			<svelte:component this={MatchWholeWordIcon} />
		</div>
		<div
			id="typeSelection"
			class="search-option"
			style:background={selectionType === "regex" ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}>
			<svelte:component this={RegexIcon} />
		</div>
	</div>
	<Button
		style="margin-left: 10px; height: 33.5px"
		variant="outlined"
		on:click={setSelection}>
		<Label>Set</Label>
	</Button>
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
	.container {
		display: flex;
		align-items: center;
		margin-left: 5px;
	}
	.search-bar {
		display: flex;
		align-items: center;
		width: 250px;
		border: 1px solid var(--G4);
		border-radius: 5px;
	}
	.search-option {
		margin-right: 1px;
		padding: 2px 2px;
		border-radius: 5px;
		width: fit-content;
		cursor: pointer;
	}
	.search-option:hover {
		background: var(--G5);
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
