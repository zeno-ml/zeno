<script lang="ts">
	import { Icon } from "@smui/button";
	import Ripple from "@smui/ripple";
	import Textfield from "@smui/textfield";
	import { Svg } from "@smui/common/elements";
	import { mdiPencilOutline } from "@mdi/js";

	import { clickOutside } from "../clickOutside";
	import { report as selectedReport, reports } from "../stores";

	export let report;
	export let reportIndex;

	let editMode = false;
</script>

<div
	use:clickOutside
	on:click_outside={() => {
		if (editMode) {
			editMode = false;
			reports.update((reps) => {
				reps[reportIndex].name = report.name;
				return reps;
			});
		}
	}}>
	<div
		use:Ripple={{ surface: true, color: "primary" }}
		class="report {$selectedReport === reportIndex ? 'selected' : ''}"
		on:click={() => selectedReport.set(reportIndex)}>
		{#if !editMode}
			<p>{report.name}</p>
		{:else}
			<Textfield bind:value={report.name} />
		{/if}

		<div class="options">
			<p style:margin-right="10px">{report.reportPredicates.length} tests</p>
			<p style:margin-right="10px">
				{report.reportPredicates.filter(
					(r) => r.results[r.results.length - 1] === 1
				).length}/{report.reportPredicates.filter(
					(r) => r.results[r.results.length - 1] > -1
				).length} passing
			</p>
			<div style:width="24px" style:height="24" style:cursor="pointer">
				<Icon
					component={Svg}
					viewBox="0 0 24 24"
					on:click={(e) => {
						e.stopPropagation();
						editMode = !editMode;
					}}>
					<path fill="black" d={mdiPencilOutline} />
				</Icon>
			</div>
			<div style:cursor="pointer">
				<Icon
					class="material-icons"
					on:click={(e) => {
						e.stopPropagation();
						reports.update((reps) => {
							reps.splice(reportIndex, 1);
							return reps;
						});
					}}>
					delete_outline
				</Icon>
			</div>
		</div>
	</div>
</div>

<style>
	.report {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 0.5px solid rgb(224, 224, 224);
		border-top: 0.5px solid rgb(224, 224, 224);
		padding-left: 10px;
		padding-right: 10px;
	}
	.selected {
		background: #f9f5ff;
	}
	.options {
		display: flex;
		flex-direction: inline;
		align-items: center;
	}
</style>
