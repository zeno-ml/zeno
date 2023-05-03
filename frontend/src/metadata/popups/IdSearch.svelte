<script lang="ts">
	import AutoComplete from "simple-svelte-autocomplete";
	import { tooltip } from "@svelte-plugins/tooltips";
	import MatchWholeWordIcon from "../cells/metadata-cells/static/MatchWholeWordIcon.svelte";
	import RegexIcon from "../cells/metadata-cells/static/RegexIcon.svelte";
	import { ZenoService } from "../../zenoservice";

	export let predicate;
	export let col;

	// option box selection
	let selectionType = predicate.operation.includes("re") ? "regex" : "string";
	let caseMatch = predicate.operation.includes("ca");
	let wholeWordMatch = predicate.operation.includes("w");

	// checking if regex is valid, such as not closing brackets (
	let regexValid = true;
	// forcing the autocomplete to rerender and show new search result after clicking the option
	let refresh = 0;

	let noResultsText = "No results";
	let searchResults = [];

	// option string for slice detail when hovering over slice,
	// use an array to keep the same order for case, wholeword, regex
	let opString = [
		"match",
		caseMatch ? "(case)" : "",
		wholeWordMatch ? "(wholeword)" : "",
		selectionType === "regex" ? "(regex)" : "",
	];

	$: {
		regexValid = true;
		if (selectionType === "regex") {
			try {
				new RegExp(predicate.value);
			} catch (e) {
				regexValid = false;
			}
		}
	}

	async function searchItems(input: string) {
		if (selectionType === "regex") {
			try {
				new RegExp(input);
				noResultsText = "No results";
			} catch (e) {
				noResultsText = "Invalid Regex";
				searchResults = [];
				return searchResults;
			}
		}

		try {
			searchResults = await ZenoService.filterStringMetadata({
				column: col,
				filterString: input,
				selectionType: selectionType,
				caseMatch: caseMatch,
				wholeWordMatch: wholeWordMatch,
			});
			return searchResults;
		} catch (e) {
			searchResults = [];
			return searchResults;
		}
	}

	function optionClick(e) {
		if (e.currentTarget instanceof HTMLElement) {
			let id = e.currentTarget.id;
			if (id === "caseMatch") {
				caseMatch = !caseMatch;
				opString[1] = caseMatch ? "(case)" : "";
			} else if (id === "wholeWordMatch") {
				wholeWordMatch = !wholeWordMatch;
				opString[2] = wholeWordMatch ? "(wholeword)" : "";
			} else {
				if (selectionType === "regex") {
					selectionType = "string";
					noResultsText = "No results";
					regexValid = true;
					opString[3] = "";
				} else {
					selectionType = "regex";
					opString[3] = "(regex)";
				}
			}
		}
		predicate.operation = opString.filter((e) => e).join(" ");
		refresh++;
	}
</script>

<div class="container">
	{#key refresh}
		<AutoComplete
			style="height: 37px"
			id="autoinput"
			bind:text={predicate.value}
			{noResultsText}
			hideArrow={true}
			searchFunction={searchItems}
			cleanUserText={false}
			ignoreAccents={false}
			localFiltering={false}
			delay={200}>
			<div slot="no-results" let:noResultsText>
				<span style:color={regexValid ? "" : "red"}>{noResultsText}</span>
			</div>
		</AutoComplete>
	{/key}
	<div class="option-box">
		<div
			id="caseMatch"
			class="search-option"
			style:background={caseMatch ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}
			use:tooltip={{
				content: "Match Case",
				theme: "zeno-tooltip",
				autoPosition: true,
			}}>
			Aa
		</div>
		<div
			id="wholeWordMatch"
			class="search-option"
			style:background={wholeWordMatch ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}
			use:tooltip={{
				content: "Match Whole Word",
				theme: "zeno-tooltip",
				autoPosition: true,
			}}>
			<svelte:component this={MatchWholeWordIcon} />
		</div>
		<div
			id="typeSelection"
			class="search-option"
			style:background={selectionType === "regex" ? "var(--P2)" : ""}
			on:keydown={() => ({})}
			on:click={optionClick}
			use:tooltip={{
				content: "Use Regular Expression",
				theme: "zeno-tooltip",
				autoPosition: true,
			}}>
			<svelte:component this={RegexIcon} />
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		margin-left: 5px;
	}
	.option-box {
		margin-left: 10px;
		display: flex;
		align-items: center;
		border: 1px solid
			var(--mdc-outlined-button-outline-color, rgba(0, 0, 0, 0.12));
		border-radius: var(
			--mdc-outlined-button-container-shape,
			var(--mdc-shape-small, 4px)
		);
	}
	.search-option {
		display: flex;
		align-items: center;
		padding: 2px 3px;
		padding-left: 6px;
		padding-right: 6px;
		height: 30px;
		cursor: pointer;
	}
	.search-option:hover {
		background: var(--Y1);
	}
</style>
