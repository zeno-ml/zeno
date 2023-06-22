<script lang="ts">
	import Button from "@smui/button";
	import { TrailingIcon } from "@smui/chips";
	import { Label } from "@smui/common";
	import { type FilterPredicate, type ZenoColumn } from "../../../zenoservice";
	import TextMetadataOptionBox from "./TextMetadataOptionBox.svelte";

	export let col: ZenoColumn;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let searchString = "";
	let notOption = false;
	let isRegex = false;
	let caseMatch = false;
	let wholeWordMatch = false;

	let blur = function (ev) {
		ev.target.blur();
	};

	/** show the string search in chips and selection bar **/
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
</script>

<div class="container">
	<TextMetadataOptionBox
		popup={false}
		bind:searchString
		bind:col
		bind:notOption
		bind:isRegex
		bind:caseMatch
		bind:wholeWordMatch />
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
