<script lang="ts">
	import { tab } from "../../stores";
	import Svelecte from "svelecte";
	export let title;
	export let options;
	export let value;
	export let placeholder;

	let style = "margin-top: 5px;";

	if (title === "Model") {
		style += "z-index: 6; margin-right: 10px; width: 167px;";
	} else if (
		(title === "Metric" && $tab === "explore") ||
		title === "Model to Compare"
	) {
		style += "z-index: 6; width: 167px;";
	} else if (title === "Metric" && $tab === "comparison") {
		style += "z-index: 5; width: 343px;";
	}
</script>

<div>
	<div class="options-header">{title}</div>
	<Svelecte
		{style}
		{options}
		labelAsValue={true}
		{value}
		on:change={(e) => {
			if (e.detail.label !== value) {
				value = e.detail.label;
			}
		}}
		{placeholder} />
</div>

<style>
	.options-header {
		margin-top: 5px;
		color: var(--G2);
	}
</style>
