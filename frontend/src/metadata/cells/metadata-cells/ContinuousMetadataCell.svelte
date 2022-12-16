<script lang="ts">
	import type { View } from "svelte-vega";

	import { VegaLite } from "svelte-vega";
	import { continuousVegaSpec } from "./vegaSpecs";
	import { metricRange } from "../../../stores";

	export let col: ZenoColumn;
	export let histogram;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let view: View;
	let localSelection = [];
	let localSelectionX = [];

	function updateSel() {
		if (filterPredicates.length !== 0) {
			view.signal("brush", { bucket: localSelection });
			view.signal("brush_x", localSelectionX);
		} else {
			view.signal("brush", {});
			view.signal("brush_x", []);
		}
		view.runAsync();
	}

	$: if (view && filterPredicates) {
		updateSel();
	}

	$: chartData = {
		table: histogram,
	};

	$: if (view) {
		view.addSignalListener(
			"brush",
			(...s) => (localSelection = s[1].bucket ? s[1].bucket : [])
		);
		view.addSignalListener("brush_x", (...s) => (localSelectionX = s[1]));
	}

	function setSelection() {
		if (localSelection.length > 0) {
			filterPredicates[0] = {
				column: col,
				operation: ">=",
				value: localSelection[0],
				join: "&",
			} as FilterPredicate;
			filterPredicates[1] = {
				column: col,
				operation: "<=",
				value: localSelection[1],
				join: "&",
			} as FilterPredicate;
		} else {
			localSelection = [];
			filterPredicates = [];
		}
		updatePredicates(filterPredicates);
	}

	$: console.log(col.name, chartData);
</script>

<div id="histogram" on:mouseup={setSelection}>
	<VegaLite
		bind:view
		spec={continuousVegaSpec($metricRange)}
		data={chartData}
		options={{ tooltip: true, actions: false, theme: "vox" }} />
</div>