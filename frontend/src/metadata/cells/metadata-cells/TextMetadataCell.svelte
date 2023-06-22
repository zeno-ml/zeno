<script lang="ts">
	import Button from "@smui/button";
	import { TrailingIcon } from "@smui/chips";
	import { Label } from "@smui/common";
	import { tooltip } from "@svelte-plugins/tooltips";
	import AutoComplete from "simple-svelte-autocomplete";
	import {
		ZenoService,
		type FilterPredicate,
		type ZenoColumn,
	} from "../../../zenoservice";
	import MatchWholeWordIcon from "./static/MatchWholeWordIcon.svelte";
	import RegexIcon from "./static/RegexIcon.svelte";

	export let col: ZenoColumn;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let searchString = "";
	let notOption = false;
	let isRegex = false;
	let regexValid = true;
	let caseMatch = false;
	let wholeWordMatch = false;
	let refresh = 0;
	let noResultsText = "No results";
	let results = [];

	let blur = function (ev) {
		ev.target.blur();
	};
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

	function setSelection() {
		if (!searchString) {
			return;
		}

		// option string for slice detail when hovering over slice,
		// use an array to keep the same order for case, wholeword, regex
		let opString = [
			notOption ? "not " : "",
			"match",
			caseMatch ? "(case)" : "",
			wholeWordMatch ? "(wholeword)" : "",
			isRegex ? "(regex)" : "",
		];

		filterPredicates.push({
			column: col,
			operation: opString.filter((e) => e).join(" "),
			value: searchString,
			join: "",
		});

		if (filterPredicates.length > 1) {
			filterPredicates[filterPredicates.length - 1].join = "|";
		}
		updatePredicates(filterPredicates);

		searchString = "";
	}

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

<div class="container">
	<div class="option-box" style:margin-right="10px">
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
			~
		</div>
	</div>
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
	<Button
		style="margin-left: 10px; height: 32px"
		variant="outlined"
		on:click={setSelection}
		on:mouseleave={blur}
		on:focusout={blur}>
		<Label>Set</Label>
	</Button>
</div>

<div class="chips">
	{#each filterPredicates as pred}
		<div class="meta-chip">
			<span>
				{pred.operation}
				'{pred.value}'
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
		height: 26px;
		cursor: pointer;
	}
	.search-option:hover {
		background: var(--Y1);
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
