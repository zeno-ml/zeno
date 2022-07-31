<script lang="ts">
	import Select, { Option } from "@smui/select";
	import IconButton, { Icon } from "@smui/icon-button";
	import Autocomplete from "@smui-extra/autocomplete";
	import { Svg } from "@smui/common/elements";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";
	import { mdiTrashCanOutline } from "@mdi/js";

	import { currentColumns } from "../../stores";

	export let predicate: FilterPredicate;
	export let deletePredicate: () => void;
	export let index;

	let operations = ["==", "!=", ">", "<", ">=", "<="];
</script>

<div id="group">
	{#if index === 0}
		<span id="where">Where</span>
	{:else}
		<Select
			bind:value={predicate.join}
			label="Join"
			style="margin-right: 20px; width: 90px">
			{#each ["AND", "OR"] as o}
				<Option value={o}>{o}</Option>
			{/each}
		</Select>
	{/if}
	<div class="selector">
		<Autocomplete
			options={$currentColumns}
			getOptionLabel={(option) => (option ? option.name : "")}
			bind:value={predicate.column}
			label="Metadata or Slice" />
	</div>
	<div class="selector">
		<Select
			bind:value={predicate.operation}
			label="Operation"
			style="margin-right: 20px; width:125px">
			{#each operations as o}
				<Option value={o}>{o}</Option>
			{/each}
		</Select>
	</div>

	<div>
		<Textfield bind:value={predicate.value} label="Value" style="width: 100px">
			<HelperText slot="helper">0</HelperText>
		</Textfield>
	</div>
	<div class="selector" style:margin-top="10px">
		<IconButton on:click={deletePredicate}>
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="currentColor" d={mdiTrashCanOutline} />
			</Icon>
		</IconButton>
	</div>
</div>

<style>
	.selector {
		margin-left: 10px;
		margin-right: 10px;
	}
	#group {
		display: flex;
		flex-direction: inline;
	}
	#where {
		margin-top: 15px;
		margin-right: 70px;
	}
</style>