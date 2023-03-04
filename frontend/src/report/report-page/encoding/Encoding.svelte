<script lang="ts">
	import { ready, report, reports } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import SlicesEncoding from "./SlicesEncoding.svelte";
	import MetricsEncoding from "./MetricsEncoding.svelte";
	import ModelsEncoding from "./ModelsEncoding.svelte";

	const EncodingMap = {
		slices: SlicesEncoding,
		metrics: MetricsEncoding,
		models: ModelsEncoding,
	};
</script>

{#if $ready}
	<div id="encoding">
		<h4 class="edit-type">Encoding</h4>
		<div id="encoding-flex">
			<div class="parameters">
				<h4 class="select-label">x</h4>
				<Select
					bind:value={$reports[$report].parameters.xEncoding}
					class="select"
					variant="outlined">
					<Option value={"slices"}>slices</Option>
					<Option value={"models"}>models</Option>
					<Option value={"metrics"}>metrics</Option>
				</Select>
			</div>
			<svelte:component
				this={EncodingMap[$reports[$report].parameters.xEncoding]} />

			<div class="parameters">
				<h4 class="select-label">y</h4>
				<Select
					bind:value={$reports[$report].parameters.yEncoding}
					class="select"
					variant="outlined">
					<Option value={"slices"}>slices</Option>
					<Option value={"models"}>models</Option>
					<Option value={"metrics"}>metrics</Option>
				</Select>
			</div>
			<svelte:component
				this={EncodingMap[$reports[$report].parameters.yEncoding]} />

			<div class="parameters">
				<h4 class="select-label">color</h4>
				<Select
					bind:value={$reports[$report].parameters.colorEncoding}
					class="select"
					variant="outlined">
					<Option value={"slices"}>slices</Option>
					<Option value={"models"}>models</Option>
					<Option value={"metrics"}>metrics</Option>
				</Select>
			</div>
			<svelte:component
				this={EncodingMap[$reports[$report].parameters.colorEncoding]} />
		</div>
	</div>
{/if}

<style>
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 280px;
	}
	.edit-type {
		border-bottom: 1px solid var(--G4);
	}
	#encoding {
		margin-bottom: 20px;
	}
	#encoding-flex {
		display: flex;
		flex-direction: column;
	}
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.select-label {
		margin: 5px;
	}
</style>
