<script lang="ts">
	import { Icon } from "@smui/button";
	import Ripple from "@smui/ripple";
	import Textfield from "@smui/textfield";
	import { Svg } from "@smui/common/elements";
	import { mdiPencilOutline } from "@mdi/js";

	import { clickOutside } from "../clickOutside";
	import { report, reports } from "../stores";
	import { updateReports } from "../util";

	export let i;

	let rep: Report = $reports[i];
	let name = rep.name;
	let editMode = false;
</script>

<div
	use:clickOutside
	on:click_outside={() => {
		editMode = false;
		reports.update((reps) => {
			reps[i].name = name;
			updateReports(reps);
			return reps;
		});
	}}>
	<div
		use:Ripple={{ surface: true, color: "primary" }}
		class="report {$report === i ? 'selected' : ''}"
		on:click={() => report.set(i)}>
		{#if !editMode}
			<p>{rep.name}</p>
		{:else}
			<Textfield bind:value={name} />
		{/if}

		<div class="options">
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
							reps.splice(i, 1);
							updateReports(reps);
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
	}
</style>
