<script lang="ts">
	import { Icon } from "@smui/button";
	import Textfield from "@smui/textfield";
	import IconButton from "@smui/icon-button";
	import { Svg } from "@smui/common/elements";
	import { mdiPencilOutline, mdiDotsHorizontal } from "@mdi/js";

	import { clickOutside } from "../util/clickOutside";
	import { report as selectedReport, reports } from "../stores";

	export let report;
	export let reportIndex;

	let hovering = false;
	let showOptions = false;
	let editMode = false;
</script>

<div
	on:mouseover={() => (hovering = true)}
	on:focus={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	on:blur={() => (hovering = false)}
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
			<div class="group">
				<div style:width="36px">
					{#if hovering}
						<IconButton
							size="button"
							style="padding: 0px"
							on:click={(e) => {
								e.stopPropagation();
								showOptions = !showOptions;
							}}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiDotsHorizontal} />
							</Icon>
						</IconButton>
					{/if}
				</div>

				{#if showOptions}
					<div
						id="options-container"
						on:mouseleave={() => (showOptions = false)}
						on:blur={() => (showOptions = false)}>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								editMode = !editMode;
							}}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiPencilOutline} />
							</Icon>
						</IconButton>
						<IconButton
							on:click={(e) => {
								e.stopPropagation();
								showOptions = false;
								reports.update((reps) => {
									reps.splice(reportIndex, 1);
									return reps;
								});
							}}>
							<Icon class="material-icons">delete_outline</Icon>
						</IconButton>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.report {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid #e0e0e0;
		border-radius: 5px;
		margin-top: 5px;
		margin-bottom: 5px;
		padding-left: 10px;
		padding-right: 10px;
		overflow: visible;
		cursor: pointer;
	}
	.selected {
		background: #f9f5ff;
	}
	.options {
		display: flex;
		flex-direction: inline;
		align-items: center;
	}
	#options-container {
		z-index: 5;
		background: white;
		margin-top: -1px;
		border: 1px solid #e8e8e8;
		position: absolute;
		height: max-content;
		display: flex;
	}
	.group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}
</style>
