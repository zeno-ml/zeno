<script lang="ts">
	import Select, { Option } from "@smui/select";

	import {
		metric,
		metrics,
		transform,
		transforms,
		report,
		reports,
		ready,
	} from "../stores";

	import ReportsList from "./ReportsList.svelte";
	import SliceTable from "./slice-table/SliceTable.svelte";
	import ReportTable from "./report/ReportTable.svelte";
</script>

<main>
	{#if $ready}
		<div id="reports">
			<ReportsList />
			{#if $reports[$report]}
				<ReportTable report={$reports[$report]} />
			{/if}
		</div>
		<div id="slices">
			<div class="settings">
				{#if $metrics}
					<Select
						bind:value={$metric}
						label="Metric"
						style="margin-right: 20px;">
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
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 80px);
	}
	#slices {
		padding: 20px;
		border-top: 1px solid #e0e0e0;
		background: #fafafa;
		max-height: 300px;
		min-height: 300px;
		overflow-y: scroll;
	}
	#reports {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 420px);
		min-height: calc(100vh - 420px);
	}
	.settings {
		margin-bottom: 10px;
	}
</style>
