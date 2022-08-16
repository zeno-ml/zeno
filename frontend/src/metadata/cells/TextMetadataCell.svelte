<script lang="ts">
	import Textfield from "@smui/textfield";
	import Button from "@smui/button";
	import { Label } from "@smui/common";

	import { metadataSelections } from "../../stores";

	export let selection;
	export let setSelection;
	export let hash;

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

	metadataSelections.subscribe((sel) => {
		if (!sel.has(hash)) {
			regex = "";
			selection.values = [];
		}
	});
</script>

<div class="container">
	<Textfield bind:value={regex} label="Regex filter" />

	<Button
		style="margin-left: 10px;"
		variant={selection.values.length > 0 && selection.values[0] === regex
			? "unelevated"
			: "outlined"}
		on:click={() => {
			if (selection.values.length > 0 && selection.values[0] === regex) {
				selection.values = [];
			} else {
				selection.values = [regex];
			}
			setSelection();
		}}>
		<Label>Set</Label>
	</Button>
	{#if !valid}
		<p style="margin-right: 10px; color: #B71C1C">Invalid regex</p>
	{/if}
	<p />
</div>

<style>
	.container {
		display: flex;
		align-items: end;
		margin-left: 5px;
	}
</style>
