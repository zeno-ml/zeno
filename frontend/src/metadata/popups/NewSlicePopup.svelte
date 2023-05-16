<script lang="ts">
	import Button from "@smui/button";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import { selections, showNewSlice, slices, sliceToEdit } from "../../stores";
	import { clickOutside } from "../../util/clickOutside";
	import {
		ZenoService,
		type FilterPredicateGroup,
		type Slice,
	} from "../../zenoservice";
	import FilterGroupEntry from "./FilterGroupEntry.svelte";

	let sliceName = "";
	let folder = "";
	let predicateGroup: FilterPredicateGroup = { predicates: [], join: "" };
	let nameInput;
	let paperHeight;

	// Track original settings when editing.
	let originalName = "";
	let originalPredicates;

	$: isValidPredicates = checkValidPredicates(predicateGroup.predicates);
	$: if ($showNewSlice && nameInput) {
		nameInput.getElement().focus();
	}
	// Declare this way instead of subscribe to avoid mis-tracking on $sliceToEdit.
	$: $showNewSlice, updatePredicates();

	// check if predicates are valid (not empty)
	function checkValidPredicates(preds) {
		let valid = preds.length > 0;
		preds.forEach((p, i) => {
			if (i !== 0 && p["join"] === "") {
				valid = false;
			} else {
				if (p["predicates"]) {
					valid = checkValidPredicates(p["predicates"]);
				} else {
					if (
						p["column"] === null ||
						p["operation"] === "" ||
						p["value"] === "" ||
						p["value"] === null
					) {
						valid = false;
					}
				}
			}
		});
		return valid;
	}

	function updatePredicates() {
		predicateGroup = { predicates: [], join: "" };

		if ($sliceToEdit) {
			sliceName = $sliceToEdit.sliceName;
			predicateGroup = $sliceToEdit.filterPredicates;
			folder = $sliceToEdit.folder;
			originalName = sliceName;
			// deep copy of predicate group to avoid sharing nested objects
			originalPredicates = JSON.parse(JSON.stringify(predicateGroup));

			// revert to original settings when close the slice popup w/ invalid predicates
			if (!isValidPredicates) {
				predicateGroup = originalPredicates;
			}
			return;
		}

		// Pre-fill slice creation with current metadata selections.
		// Join with AND.
		predicateGroup.predicates = Object.values($selections.metadata)
			.filter((d) => d.predicates.length > 0)
			.flat()
			.map((d, i) => {
				if (i !== 0 || $selections.slices.length > 0) {
					d.join = "&";
				}
				return d;
			});

		// if slices are not empty in $selections
		if ($selections.slices.length > 0) {
			let slicesPredicates;
			$selections.slices.forEach((s, i) => {
				let sli_preds = $slices.get(s).filterPredicates;
				if (i !== 0) {
					sli_preds.join = "&";
				}
				slicesPredicates = JSON.parse(JSON.stringify(sli_preds));
			});
			slicesPredicates.predicates = [
				...slicesPredicates.predicates,
				...predicateGroup.predicates,
			];
			predicateGroup = slicesPredicates;
		}

		// If no predicates, add an empty one.
		if (predicateGroup.predicates.length === 0) {
			predicateGroup.predicates.push({
				column: null,
				operation: "",
				value: "",
				join: "",
			});
		}
	}

	function createSlice() {
		if (sliceName.length === 0) {
			sliceName = "Slice " + $slices.size;
		}

		if ($sliceToEdit && originalName !== sliceName) {
			ZenoService.deleteSlice([originalName]).then(() => {
				slices.update((s) => {
					s.delete(originalName);
					return s;
				});
			});
		}

		ZenoService.createNewSlice({
			sliceName,
			filterPredicates: predicateGroup,
			folder: folder,
		}).then(() => {
			slices.update((s) => {
				s.set(sliceName, <Slice>{
					sliceName,
					folder,
					filterPredicates: Object.assign({}, predicateGroup),
				});
				return s;
			});
			selections.update(() => ({
				slices: [],
				metadata: {},
				tags: [],
			}));
			showNewSlice.set(false);
			sliceToEdit.set(null);
		});
	}

	function deletePredicate(i) {
		predicateGroup.predicates.splice(i, 1);
		if (predicateGroup.predicates.length !== 0) {
			predicateGroup.predicates[0].join = "";
		}
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
	bind:clientHeight={paperHeight}
	use:clickOutside
	on:click_outside={() => showNewSlice.set(false)}>
	<Paper
		elevation={7}
		class="paper"
		style="max-height: 75vh; {paperHeight &&
		paperHeight > window.innerHeight * 0.75
			? 'overflow-y: scroll'
			: 'overflow-y: show'}">
		<Content>
			<Textfield
				bind:value={sliceName}
				label="Slice Name"
				bind:this={nameInput} />
			<FilterGroupEntry
				index={-1}
				deletePredicate={() => deletePredicate(-1)}
				bind:predicateGroup />
			<div id="submit">
				<Button
					variant="outlined"
					on:click={createSlice}
					disabled={(!$sliceToEdit && $slices.has(sliceName)) ||
						($sliceToEdit &&
							originalName !== sliceName &&
							$slices.has(sliceName)) ||
						!isValidPredicates}>
					{$sliceToEdit ? "Update Slice" : "Create Slice"}
				</Button>
				<Button
					style="margin-right: 10px"
					variant="outlined"
					on:click={() => showNewSlice.set(false)}>
					cancel
				</Button>
				{#if (!$sliceToEdit && $slices.has(sliceName)) || ($sliceToEdit && originalName !== sliceName && $slices.has(sliceName))}
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
		position: fixed;
		left: 440px;
		top: 70px;
		z-index: 20;
	}
	#submit {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
	}
</style>
