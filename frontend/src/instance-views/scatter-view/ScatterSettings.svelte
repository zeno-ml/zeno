<script lang="ts">
	import { Icon } from "@smui/icon-button";
	import Slider from "@smui/slider";
	import FormField from "@smui/form-field";

	export let pointSizeSlider = 3;
</script>

<!-- settings/controls for the scatterplot -->
<div class="title">
	<Icon class="material-icons" style="font-size: inherit; color: inherit;">
		settings
	</Icon>
	<span id="setting">Settings</span>
</div>
<FormField style="display: flex;">
	<span
		slot="label"
		style="padding-right: 12px; width: max-content; display: block;">
		Point Size
	</span>
	<Slider
		step={1}
		min={1}
		max={10}
		bind:value={pointSizeSlider}
		discrete
		style="width: 100%" />
</FormField>

<style>
	.title {
		font-size: 18px;
		font-weight: 400;
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	#setting {
		margin-left: 5px;
	}
</style>
