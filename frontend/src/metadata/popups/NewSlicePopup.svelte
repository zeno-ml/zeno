<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";

	import autoAnimate from "@formkit/auto-animate";

	import { clickOutside } from "../../util/clickOutside";
	import {
		metadataSelections,
		settings,
		slices,
		sliceSelections,
		table,
		showNewSlice,
		sliceToEdit,
	} from "../../stores";
	import { columnHash, getFilterFromPredicates } from "../../util/util";

	import FilterEntry from "../FilterEntry.svelte";
	import FilterGroupEntry from "../FilterGroupEntry.svelte";

	let sliceName: string = "";
	let predicateGroup: FilterPredicateGroup = { predicates: [], join: "" };
	let nameInput;

	showNewSlice.subscribe(() => updatePredicates());

	function updatePredicates() {
		if ($sliceToEdit) {
			sliceName = $sliceToEdit.sliceName;
			predicateGroup = $sliceToEdit.filterPredicates;
			return;
		}
		// Pre-fill slice creation with current metadata selections.
		if ($metadataSelections.size !== 0) {
			predicateGroup.predicates = [];
			[...$metadataSelections.values()].forEach((entry) => {
				// TODO: support slice selections
				if (entry.type === "range") {
					predicateGroup.predicates.push({
						column: entry.column,
						operation: ">=",
						value: "" + entry.values[0],
						join: "AND",
					});
					predicateGroup.predicates.push({
						column: entry.column,
						operation: "<=",
						value: "" + entry.values[1],
						join: "AND",
					});
				} else if (entry.type === "binary") {
					let val = entry.values[0] === "is" ? "1" : "0";
					predicateGroup.predicates.push({
						column: entry.column,
						operation: "==",
						value: val,
						join: "AND",
					});
				} else {
					if (entry.values.length === 1) {
						predicateGroup.predicates.push({
							column: entry.column,
							operation: "==",
							value: "" + entry.values[0],
							join: "AND",
						});
					} else {
						let group = {
							predicates: [],
							join: "AND",
						};
						entry.values.forEach((v, j) =>
							group.predicates.push({
								column: entry.column,
								operation: "==",
								value: "" + v,
								join: "OR",
								depth: 1,
							})
						);
						predicateGroup.predicates.push(group);
					}
				}
			});
		} else if (predicateGroup.predicates.length === 0) {
			predicateGroup.predicates.push({
				column: undefined,
				operation: "",
				value: "",
				join: "",
			});
		}
	}

	function deletePredicate(i) {
		predicateGroup.predicates.splice(i, 1);
		predicateGroup = predicateGroup;
	}

	function createSlice() {
		if (sliceName.length === 0) {
			sliceName = "Slice " + $slices.size;
		}
		showNewSlice.set(false);
		sliceToEdit.set(null);

		const filt = getFilterFromPredicates(predicateGroup);
		let tempTable = $table.filter(`(d) => ${filt}`);

		slices.update((s) => {
			s.set(sliceName, <Slice>{
				sliceName: sliceName,
				folder: "",
				filterPredicates: predicateGroup,
				transform: "",
				idxs: tempTable.array(columnHash($settings.idColumn)) as string[],
			});
			return s;
		});
		metadataSelections.set(new Map());
		sliceSelections.set([]);
	}

	function submit(e) {
		if ($showNewSlice && e.key === "Enter") {
			createSlice();
		}
	}

	$: if ($showNewSlice && nameInput) {
		nameInput.getElement().focus();
	}
</script>

<svelte:window on:keydown={submit} />

<div>
	<Button
		variant="outlined"
		on:click={() => {
			showNewSlice.set(true);
			sliceName = "";
		}}>
		New Slice
	</Button>
	{#if $showNewSlice}
		<div
			id="paper-container"
			use:clickOutside
			on:click_outside={() => showNewSlice.set(false)}>
			<Paper elevation={7}>
				<Content>
					<Textfield bind:value={sliceName} label="Name" bind:this={nameInput}>
						<HelperText slot="helper">Slice 1</HelperText>
					</Textfield>
					<FilterGroupEntry
						first={true}
						deletePredicate={() => deletePredicate(-1)}
						bind:predicateGroup />
					<div id="submit">
						<Button variant="outlined" on:click={createSlice}>
							{$sliceToEdit !== null ? "Edit Slice" : "Create Slice"}
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
	{/if}
</div>

<style>
	#paper-container {
		position: absolute;
		z-index: 1;
		min-width: 900px;
		margin-top: 10px;
	}
	#submit {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
	}
	ul {
		list-style-type: none;
		padding: 10px;
		background: #fafafa;
		border-radius: 5px;
	}
</style>
