<script lang="ts">
	import Button from "@smui/button";
	import { Label } from "@smui/common";

	import { filteredTable, metadataSelections } from "../../stores";

	export let selection;
	export let setSelection;
	export let hash;
	export let selectedHash;
	export let colorAssignments;

	metadataSelections.subscribe((sel) => {
		if (!sel.has(hash)) {
			selection.values = [];
		}
	});
</script>

<div style:display="flex">
	<div
		class="binary-button"
		style=" 'grey'
			: 'a'}">
		<Button
			variant={selection.values.length > 0 && selection.values[0] === "is"
				? "unelevated"
				: "outlined"}
			on:click={() => {
				selection.values = selection.values[0] === "is" ? [] : ["is"];
				setSelection();
			}}>
			<Label style="color: {selectedHash ? colorAssignments.colors[1] : ''}; ">
				True
			</Label>
		</Button>
		{$filteredTable.filter(`d => d["${hash}"] == 1`).count().object()["count"]}
	</div>
	<div class="binary-button">
		<Button
			variant={selection.values.length > 0 && selection.values[0] === "is not"
				? "unelevated"
				: "outlined"}
			on:click={() => {
				selection.values = selection.values[0] === "is not" ? [] : ["is not"];
				setSelection();
			}}>
			<Label style="color: {selectedHash ? colorAssignments.colors[0] : ''};">
				False
			</Label>
		</Button>
		{$filteredTable.filter(`d => d["${hash}"] == 0`).count().object()["count"]}
	</div>
</div>

<style>
	.binary-button {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
