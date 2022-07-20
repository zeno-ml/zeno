<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";

	import autoAnimate from "@formkit/auto-animate";

	import { clickOutside } from "../clickOutside";
	import {
		metadataSelections,
		settings,
		slices,
		sliceSelections,
		table,
		showNewSlice,
		sliceToEdit,
	} from "../stores";
	import { columnHash, getFilterFromPredicates } from "../util";

	import FilterEntry from "./FilterEntry.svelte";

	let sliceName: string = "";
	let predicates: FilterPredicate[] = [];

	showNewSlice.subscribe(() => updatePredicates());

	function updatePredicates() {
		if ($sliceToEdit) {
			sliceName = $sliceToEdit.sliceName;
			predicates = $sliceToEdit.filterPredicates;
			return;
		}
		// Pre-fill slice creation with current metadata selections.
		if ($metadataSelections.size !== 0) {
			predicates = [];
			[...$metadataSelections.values()].forEach((entry) => {
				// TODO: support slice selections
				if (entry.type === "range") {
					predicates.push({
						column: entry.column,
						operation: ">=",
						value: "" + entry.values[0],
						join: "AND",
					});
					predicates.push({
						column: entry.column,
						operation: "<=",
						value: "" + entry.values[1],
						join: "AND",
					});
				} else if (entry.type === "binary") {
					let val = entry.values[0] === "is" ? "1" : "0";
					predicates.push({
						column: entry.column,
						operation: "==",
						value: val,
						join: "AND",
					});
				} else {
					if (entry.values.length === 1) {
						predicates.push({
							column: entry.column,
							operation: "==",
							value: "" + entry.values[0],
							join: "AND",
						});
					} else {
						entry.values.forEach((v, j) => {
							let indicator = "";
							if (entry.values.length > 1 && j === 0) {
								indicator = "start";
							} else if (
								entry.values.length > 1 &&
								j === entry.values.length - 1
							) {
								indicator = "end";
							}
							predicates.push({
								column: entry.column,
								operation: "==",
								value: "" + v,
								join: "OR",
								groupIndicator: indicator,
							});
						});
					}
				}
			});
		} else if (predicates.length === 0) {
			predicates.push({
				column: undefined,
				operation: "",
				value: "",
				join: "",
			});
		}
	}

	function deletePredicate(i) {
		predicates.splice(i, 1);
		predicates = predicates;
	}

	function createSlice() {
		if (sliceName.length === 0) {
			sliceName = "Slice " + $slices.size;
		}
		showNewSlice.set(false);
		sliceToEdit.set(null);

		const filt = getFilterFromPredicates(predicates);
		let tempTable = $table.filter(`(d) => ${filt}`);

		slices.update((s) => {
			s.set(sliceName, <Slice>{
				sliceName: sliceName,
				folder: "",
				filterPredicates: predicates,
				transform: "",
				idxs: tempTable.array(columnHash($settings.idColumn)) as string[],
			});
			return s;
		});
		metadataSelections.set(new Map());
		sliceSelections.set([]);
	}

	function submit(e) {
		if (e.key === "Enter") {
			createSlice();
		}
	}
</script>

<svelte:window on:keydown={submit} />

<div>
	<Button variant="outlined" on:click={() => showNewSlice.set(true)}>
		New Slice
	</Button>
	{#if $showNewSlice}
		<div
			id="paper-container"
			use:clickOutside
			on:click_outside={() => showNewSlice.set(false)}>
			<Paper elevation={7}>
				<Content>
					<Textfield bind:value={sliceName} label="Name">
						<HelperText slot="helper">Slice 1</HelperText>
					</Textfield>
					<ul use:autoAnimate>
						{#each predicates as p, i}
							<li>
								<FilterEntry
									first={i === 0 ? true : false}
									deletePredicate={() => deletePredicate(i)}
									bind:predicate={p} />
							</li>
						{/each}
					</ul>
					<div
						class="add"
						on:click={() => {
							predicates.push({
								column: undefined,
								operation: "",
								value: "",
								join: "AND",
							});
							predicates = predicates;
						}}>
						add filter
					</div>
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
	.add {
		padding: 5px;
		width: max-content;
		margin-top: 10px;
		cursor: pointer;
		color: #6200ee;
	}
	.add:hover {
		background: #ede1fd;
		border-radius: 5px;
	}
	ul {
		list-style-type: none;
	}
</style>
