<script lang="ts">
	import Select, { Option } from "@smui/select";
	import { Svg } from "@smui/common/elements";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
	import { slide } from "svelte/transition";

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

	let showSlices = true;
</script>

<main>
	{#if $ready}
		<ReportsList />
		<div id="report-panel">
			<div id="reports">
				{#if $reports[$report]}
					<ReportTable report={$reports[$report]} />
				{/if}
			</div>
			<div id="slice-container">
				<div id="slice-show">
					<IconButton
						ripple={false}
						on:click={() => (showSlices = !showSlices)}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path
								fill="black"
								d={showSlices ? mdiChevronDown : mdiChevronUp} />
						</Icon>
					</IconButton>
				</div>
				{#if showSlices}
					<div id="slices" in:slide out:slide>
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
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		max-height: calc(100vh - 80px);
	}
	#slice-container {
		position: absolute;
		width: calc(100% - 470px);
		bottom: 0;
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
		flex-direction: column;
	}
	#report-panel {
		width: 100%;
	}
	.settings {
		margin-bottom: 10px;
	}
	#slice-show {
		background: #f9f5ff;
		width: fit-content;
		border-top-right-radius: 5px;
		border-top-left-radius: 5px;
	}
</style>
