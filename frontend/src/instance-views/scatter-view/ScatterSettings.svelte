<script lang="ts">
	import FormField from "@smui/form-field";
	import { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import Slider from "@smui/slider";
	import { ZenoColumnType, type ZenoColumn } from "../../zenoservice";
	import { model, status } from "../../stores";
	import { columnHash } from "../../util/util";

	export let pointSizeSlider = 3;
	export let colorByColumn: ZenoColumn;
</script>

<!-- settings/controls for the scatterplot -->
<div class="title">
	<Icon class="material-icons" style="font-size: inherit; color: inherit;">
		settings
	</Icon>
	<span id="setting">Settings</span>
</div>
<Select
	value={colorByColumn}
	on:MDCSelect:change={(e) => (colorByColumn = e.detail.value)}
	key={(v) => columnHash(v)}
	label="Color By"
	style="width: calc(100% - 30px); margin-bottom: 10px; ">
	{#each $status.completeColumns.filter((c) => (c.model === $model && c.columnType !== ZenoColumnType.EMBEDDING) || c.model === "") as c}
		<Option value={c}>{c.name}</Option>
	{/each}
</Select>
<FormField style="display: flex;">
	<span
		slot="label"
		style="padding-right: 40px; width: max-content; display: block;">
		Point Size
	</span>
	<Slider
		step={1}
		min={1}
		max={10}
		bind:value={pointSizeSlider}
		discrete
		style="width: 100%; margin-left: 0px; margin-right: 20px;" />
</FormField>

<style>
	.title {
		font-size: 18px;
		font-weight: 400;
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 5px;
	}
	#setting {
		margin-left: 5px;
	}
</style>
