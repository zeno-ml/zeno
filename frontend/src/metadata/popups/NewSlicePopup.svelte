<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";

	import { showNewSlice, slices, selections, sliceToEdit } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";

	import { createNewSlice } from "../../api";
	import FilterGroupEntry from "./FilterGroupEntry.svelte";

	let sliceName = "";
	let folder = "";
	let predicateGroup: FilterPredicateGroup = { predicates: [], join: "" };
	let nameInput;

	$: if ($showNewSlice && nameInput) {
		nameInput.getElement().focus();
	}

	showNewSlice.subscribe(() => updatePredicates());

	function updatePredicates() {
		predicateGroup = { predicates: [], join: "" };
		if ($sliceToEdit) {
			sliceName = $sliceToEdit.sliceName;
			predicateGroup = $sliceToEdit.filterPredicates;
			folder = $sliceToEdit.folder;
			return;
		}
		// Pre-fill slice creation with current metadata selections.
		Object.values($selections.metadata).forEach((filtGroup) => {
			if (filtGroup.predicates.length !== 0) {
				predicateGroup.predicates.push(filtGroup);
			}
		});
	}

	function createSlice() {
		if (sliceName.length === 0) {
			sliceName = "Slice " + $slices.size;
		}

		createNewSlice(sliceName, predicateGroup).then(() => {
			slices.update((s) => {
				s.set(sliceName, <Slice>{
					sliceName,
					folder,
					filterPredicates: Object.assign({}, predicateGroup),
				});
				return s;
			});
			selections.update((sels) => ({ slices: [], metadata: sels.metadata }));
			showNewSlice.set(false);
			sliceToEdit.set(null);
		});
	}

	function deletePredicate(i) {
		predicateGroup.predicates.splice(i, 1);
		predicateGroup = predicateGroup;
	}

	function submit(e) {
		if ($showNewSlice && e.key === "Enter") {
			createSlice();
		}
	}
</script>

<svelte:window on:keydown={submit} />

<div
	id="paper-container"
	use:clickOutside
	on:click_outside={() => showNewSlice.set(false)}>
	<Paper elevation={7}>
		<Content>
			{#if !$sliceToEdit}
				<Textfield bind:value={sliceName} label="Name" bind:this={nameInput}>
					<HelperText slot="helper">Slice 1</HelperText>
				</Textfield>
			{:else}
				<p>{sliceName}</p>
			{/if}
			<FilterGroupEntry
				index={-1}
				deletePredicate={() => deletePredicate(-1)}
				bind:predicateGroup />
			<div id="submit">
				<Button variant="outlined" on:click={createSlice}>
					{$sliceToEdit ? "Update Slice" : "Create Slice"}
				</Button>
				{#if $slices.has(sliceName) && $sliceToEdit === null}
					<p style:margin-right="10px" style:color="red">
						slice already exists
					</p>
				{/if}
			</div>
		</Content>
	</Paper>
</div>

<style>
	#paper-container {
		position: absolute;
		margin-top: 10px;
		z-index: 10;
	}
	#submit {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
	}
</style>
