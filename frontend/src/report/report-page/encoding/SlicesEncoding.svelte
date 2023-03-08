<script lang="ts">
	import { ready, report, reports, metric, metrics } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import { TrailingIcon } from "@smui/chips";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Paper, { Content } from "@smui/paper";
	import { mdiPlusBoxOutline } from "@mdi/js";
	import { clickOutside } from "../../../util/clickOutside";
	import SliceTable from "../../slice-table-report/SliceTable.svelte";
	$: showSlices = false;
	$: currentReport = $reports[$report];
</script>

{#if $ready}
	<div class="chips">
		{#each currentReport.slices as slice, i}
			<div class="slice-chip">
				{slice.sliceName}
				<TrailingIcon
					class="remove material-icons"
					on:click={() => {
						currentReport.slices.splice(i, 1);
						$reports[$report] = currentReport;
					}}>
					cancel
				</TrailingIcon>
			</div>
		{/each}
	</div>
	<div on:click={() => (showSlices = !showSlices)} on:keydown={() => ({})}>
		<IconButton>
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="var(--P2)" d={mdiPlusBoxOutline} />
			</Icon>
		</IconButton>
	</div>
	{#if showSlices}
		<div
			class="popup"
			use:clickOutside
			on:click_outside={() => (showSlices = false)}>
			<Paper elevation={7}>
				<Content>
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
						</div>
						<SliceTable />
					</div>
				</Content>
			</Paper>
		</div>
	{/if}
{/if}

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	.slice-chip {
		padding: 5px 10px;
		background: var(--P3);
		margin: 5px;
		border-radius: 10px;
	}
	.popup {
		position: fixed;
		top: 20vh;
		left: 25vw;
		z-index: 10;
	}
	#slices {
		padding: 20px;
		border-top: 1px solid var(--G5);
		background: var(--Y2);
		max-height: 45vh;
		overflow-y: scroll;
	}
	.settings {
		margin-bottom: 10px;
	}
</style>
