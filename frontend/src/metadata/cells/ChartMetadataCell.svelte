<script lang="ts">
	import type { View } from "svelte-vega";

	import { VegaLite } from "svelte-vega";

	import { MetadataType } from "../../globals";
	import { metadataSelections } from "../../stores";

	export let selection;
	export let setSelection;
	export let dynamicSpec;
	export let shouldColor;
	export let selectedHash;
	export let domain;
	export let histogramData;
	export let hash;
	export let metadataType;

	let view: View;

	metadataSelections.subscribe((m) => {
		if (!m.has(hash) && view) {
			if (view.getState().signals["brush_x"]) {
				view.signal("brush", {});
				if (view.getState().signals["brush_data"]) {
					view.signal("brush_data", {});
				}
				view.signal("brush_x", []);
				view.runAsync();
			}
			if (view.getState().signals["select_tuple"]) {
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
		}
	});

	$: if (view) {
		if (metadataType === MetadataType.CONTINUOUS) {
			view.addSignalListener(
				"brush",
				(...s) => (selection.values = s[1].binStart ? s[1].binStart : [])
			);
		} else if (metadataType === MetadataType.NOMINAL) {
			view.addSignalListener(
				"select",
				(...s) => (selection.values = s[1].binStart ? s[1].binStart : [])
			);
		}
	}
</script>

<div
	id="histogram"
	on:mouseup={setSelection}
	on:mouseout={setSelection}
	on:click={setSelection}
	on:blur={setSelection}>
	<VegaLite
		spec={dynamicSpec({
			colors: shouldColor && selectedHash ? domain.map((d) => d["color"]) : [],
		})}
		data={histogramData}
		bind:view
		options={{ tooltip: true, actions: false, theme: "vox" }} />
</div>
