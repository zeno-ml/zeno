<script lang="ts">
	import type { View } from "svelte-vega";

	import { VegaLite } from "svelte-vega";
	import { nominalVegaSpec } from "./vegaSpecs";
	import { metricRange } from "../../../stores";

	export let col: ZenoColumn;
	export let histogram;
	export let filterPredicates: FilterPredicate[];
	export let updatePredicates;

	let view: View;
	let localSelection = [];

	$: chartData = {
		table: histogram,
	};

	$: if (view && filterPredicates && filterPredicates.length === 0) {
		view.signal("select", {});
		view.signal("select_modify", undefined);
		view.signal("select_toggle", false);
		view.signal("select_tuple", undefined);
		view.signal("highlight", {});
		view.signal("highlight_modify", undefined);
		view.signal("highlight_toggle", false);
		view.signal("highlight_tuple", undefined);
		view.runAsync();
	}

	$: if (view) {
		view.addSignalListener(
			"select",
			(...s) => (localSelection = s[1].bucket ? s[1].bucket : [])
		);
	}

	function setSelection() {
		filterPredicates = [];
		if (localSelection.length > 0) {
			localSelection.forEach((l) => {
				filterPredicates.push({
					column: col,
					operation: "==",
					value: l,
					join: "|",
				} as FilterPredicate);
			});
		} else {
			localSelection = [];
		}
		updatePredicates(filterPredicates);
	}
</script>

<div id="histogram" on:click={setSelection} on:keydown={() => ({})}>
	<VegaLite
		bind:view
		spec={nominalVegaSpec($metricRange)}
		data={chartData}
		options={{ tooltip: true, actions: false, theme: "vox" }} />
</div>
