<script lang="ts">
	import type { View } from "svelte-vega";
	import { VegaLite } from "svelte-vega";
	import type { HistogramEntry } from "../../../api/metadata";
	import { metricRange } from "../../../stores";
	import type { FilterPredicate, ZenoColumn } from "../../../zenoservice";
	import { nominalVegaSpec } from "./vegaSpecs";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let view: View;
	let localSelection: Record<string, Array<number>> = {};
	let localSelectionTuple = {};

	function updateSel() {
		if (filterPredicates.length !== 0) {
			view.signal("select", localSelection);
			view.signal("select_tuple", localSelectionTuple);
		} else {
			view.signal("select", {});
			view.signal("select_modify", undefined);
			view.signal("select_toggle", false);
			view.signal("select_tuple", undefined);
		}
		view.runAsync();
	}

	$: if (view && filterPredicates) {
		updateSel();
	}

	$: if (view) {
		view.addSignalListener(
			"select",
			(...s) => (localSelection = s[1] ? s[1] : [])
		);
		view.addSignalListener(
			"select_tuple",
			(...s) => (localSelectionTuple = s[1] ? s[1] : [])
		);
	}

	function setSelection() {
		filterPredicates = [];
		if (localSelection.bucket && localSelection.bucket.length > 0) {
			localSelection.bucket.forEach((l, i) => {
				filterPredicates.push({
					column: col,
					operation: "==",
					value: l,
					join: i === 0 ? "" : "|",
				} as FilterPredicate);
			});
		} else {
			localSelection = {};
		}
		updatePredicates(filterPredicates);
	}
</script>

<!-- We shallow copy histogram to remove the vega identifiers and force it to update the chart when new data is passed in. -->
<div id="histogram" on:click={setSelection} on:keydown={() => ({})}>
	<VegaLite
		bind:view
		spec={nominalVegaSpec($metricRange)}
		data={{ table: histogram.map((h) => Object.assign({}, h)) }}
		options={{
			tooltip: true,
			actions: false,
			theme: "vox",
			renderer: "svg",
		}} />
</div>
