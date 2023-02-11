<script lang="ts">
	import { mdiTrashCanOutline } from "@mdi/js";
	import Autocomplete from "@smui-extra/autocomplete";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Select, { Option } from "@smui/select";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";
	import {
		MetadataType,
		ZenoColumnType,
		type FilterPredicate,
	} from "../../zenoservice";
	import { model, status } from "../../stores";

	export let predicate: FilterPredicate;
	export let deletePredicate: () => void;
	export let index;

	let operations = ["==", "!=", ">", "<", ">=", "<="];
	let valueInput;

	$: predicate.value = valueInput;
</script>

<div id="group">
	{#if index !== 0}
		<Select
			bind:value={predicate.join}
			label="Join"
			style="padding-left: 10px; margin-right: 20px; width: 90px">
			{#each ["&", "|"] as o}
				<Option value={o}>{o}</Option>
			{/each}
		</Select>
	{/if}
	<div class="selector">
		<Autocomplete
			options={$status.completeColumns.filter(
				(d) =>
					d.model === $model ||
					d.columnType === ZenoColumnType.METADATA ||
					d.columnType === ZenoColumnType.PREDISTILL
			)}
			on:change={() => {
				console.log("change");
				predicate.operation = "";
				predicate.value = "";
			}}
			getOptionLabel={(option) => (option ? option.name : "")}
			bind:value={predicate.column}
			label="Metadata or Slice" />
	</div>
	<div class="selector">
		{#if predicate.column}
			<Select
				bind:value={predicate.operation}
				label="Operation"
				style="padding-left: 5px; margin-right: 20px; width:125px">
				{#if predicate.column.metadataType === MetadataType.BOOLEAN}
					<Option value="==">==</Option>
					<Option value="!=">!=</Option>
				{:else if predicate.column.metadataType === MetadataType.OTHER}
					<Option value="match">match</Option>
					<Option value="match (regex)">match (regex)</Option>
				{:else}
					{#each operations as o}
						<Option value={o}>{o}</Option>
					{/each}
				{/if}
			</Select>
		{/if}
	</div>

	<div>
		{#if predicate.column}
			{#if predicate.column.metadataType === MetadataType.BOOLEAN}
				<Select
					key={(bool) => `${bool}`}
					bind:value={predicate.value}
					label="Value"
					style="margin-right: 20px; width:125px">
					{#each [true, false] as o}
						<Option value={o}>{o.toString()}</Option>
					{/each}
				</Select>
			{:else}
				<Textfield bind:value={valueInput} label="Value" style="width: 100px">
					<HelperText slot="helper">0</HelperText>
				</Textfield>
			{/if}
		{/if}
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
</style>
