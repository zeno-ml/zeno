<script lang="ts">
	import Select, { Option } from "@smui/select";

	import {
		metric,
		metrics,
		transform,
		transforms,
		report,
		reports,
	} from "../stores";

	import ReportsList from "./ReportsList.svelte";
	import SliceTable from "./slice-table/SliceTable.svelte";
	import ReportTable from "./report/ReportTable.svelte";
</script>

<div class="inline">
	<div>
		<ReportsList />
	</div>
	<div style:width="100%">
		{#if $reports[$report]}
			<ReportTable report={$reports[$report]} />
		{/if}
		<div class="settings">
			{#if $metrics}
				<Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
					{#each $metrics as m}
						<Option value={m}>{m}</Option>
					{/each}
				</Select>
			{/if}
			{#if $transforms}
				<Select
					bind:value={$transform}
					label="Transform"
					style="margin-right: 20px;">
					{#each ["", ...$transforms] as t}
						<Option value={t}>{t}</Option>
					{/each}
				</Select>
			{/if}
		</div>
		<SliceTable />
	</div>
</div>

<style>
	.inline {
		display: flex;
		flex-direction: row;
	}
	.settings {
		margin-top: 20px;
		margin-bottom: 10px;
	}
</style>
