<script lang="ts">
	import TextMetadataOptionBox from "../cells/metadata-cells/TextMetadataOptionBox.svelte";

	export let predicate;
	export let col;

	// option box selection
	let isRegex = predicate.operation.includes("re");
	let caseMatch = predicate.operation.includes("ca");
	let wholeWordMatch = predicate.operation.includes("w");
	let notOption = predicate.operation.includes("not");

	// updates predicate operation when options update
	$: {
		let opString = [
			notOption ? "not" : "",
			"match",
			caseMatch ? "(case)" : "",
			wholeWordMatch ? "(wholeword)" : "",
			isRegex ? "(regex)" : "",
		];
		predicate.operation = opString.filter((e) => e).join(" ");
	}
</script>

<div class="container">
	<TextMetadataOptionBox
		popup={true}
		bind:searchString={predicate.value}
		bind:col
		bind:notOption
		bind:isRegex
		bind:caseMatch
		bind:wholeWordMatch />
</div>

<style>
	.container {
		display: flex;
		align-items: center;
	}
</style>
