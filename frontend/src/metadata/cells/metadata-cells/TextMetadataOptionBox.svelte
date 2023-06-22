<script lang="ts">
	import { tooltip } from "@svelte-plugins/tooltips";
	import AutoComplete from "simple-svelte-autocomplete";
	import { ZenoService } from "../../../zenoservice";
	import MatchWholeWordIcon from "./static/MatchWholeWordIcon.svelte";
	import RegexIcon from "./static/RegexIcon.svelte";

	export let col;
	export let popup;
	export let searchString;

	// option box selection
	export let notOption;
	export let isRegex;
	export let caseMatch;
	export let wholeWordMatch;

	// checking if regex is valid, such as not closing brackets (
	let regexValid = true;
	// forcing the autocomplete to rerender and show new search result after clicking the option
	let refresh = 0;
	let noResultsText = "No results";
	let results = [];

	/** Check if the current input is a legal regex format **/
	$: {
		regexValid = true;
		if (isRegex) {
			try {
				new RegExp(searchString);
			} catch (e) {
				regexValid = false;
			}
		}
	}

	/** Show the search result when typing input in the search string box **/
	async function searchItems(input: string) {
		if (isRegex) {
			try {
				new RegExp(input);
				noResultsText = "No results";
			} catch (e) {
				noResultsText = "Invalid Regex!";
				results = [];
				return results;
			}
		}

		try {
			results = await ZenoService.filterStringMetadata({
				column: col,
				filterString: input,
				isRegex: isRegex,
				caseMatch: caseMatch,
				wholeWordMatch: wholeWordMatch,
			});
			return results;
		} catch (e) {
			results = [];
			return results;
		}
	}

	/** Control the parameters for option box **/
	function optionClick(e) {
		if (e.currentTarget instanceof HTMLElement) {
			let id = e.currentTarget.id;
			if (id === "notOption") {
				notOption = !notOption;
			} else if (id === "caseMatch") {
				caseMatch = !caseMatch;
			} else if (id === "wholeWordMatch") {
				wholeWordMatch = !wholeWordMatch;
			} else {
				if (isRegex) {
					isRegex = false;
					noResultsText = "No results";
					regexValid = true;
				} else {
					isRegex = true;
				}
			}
		}
		refresh++;
	}
</script>

<div class="option-box" style:margin-right="5px">
	<div
		id="notOption"
		class="search-option"
		style:background={notOption ? "var(--P2)" : ""}
		on:keydown={() => ({})}
		on:click={optionClick}
		use:tooltip={{
			content: "Not",
			theme: "zeno-tooltip",
			autoPosition: true,
		}}>
		NOT
	</div>
</div>
{#key refresh}
	<AutoComplete
		style={popup ? "margin-top: 1px;height: 35px" : ""}
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
		style:background={isRegex ? "var(--P2)" : ""}
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

<style>
	.option-box {
		margin-left: 5px;
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
		height: 26px;
		cursor: pointer;
	}
	.search-option:hover {
		background: var(--Y1);
	}
</style>
