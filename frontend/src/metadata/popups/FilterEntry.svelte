<script lang="ts">
	import { mdiTrashCanOutline } from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Svelecte from "svelecte";
	import { model, status } from "../../stores";
	import {
		MetadataType,
		ZenoColumnType,
		type FilterPredicate,
	} from "../../zenoservice";
	import IdSearch from "./IdSearch.svelte";

	export let predicate: FilterPredicate;
	export let deletePredicate: () => void;
	export let index;

	let operations = ["==", "!=", ">", "<", ">=", "<="];
</script>

<div id="group">
	{#if index !== 0}
		<div class="selector">
			<Svelecte
				style={"width: 60px"}
				value={predicate.join}
				on:change={(e) => {
					// avoid backspace or delete
					predicate.join = e.detail !== null ? e.detail.label : "&";
				}}
				searchable={false}
				valueField="label"
				options={["&", "|"]} />
		</div>
	{:else}
		<div style="width: 70px">
			<p>where</p>
		</div>
	{/if}
	<div class="selector">
		<Svelecte
			bind:value={predicate.column}
			placeholder={"Column"}
			valueAsObject
			valueField={"name"}
			options={$status.completeColumns.filter(
				(d) =>
					d.columnType !== ZenoColumnType.EMBEDDING &&
					(d.model === $model ||
						d.columnType === ZenoColumnType.METADATA ||
						d.columnType === ZenoColumnType.PREDISTILL)
			)}
			on:change={() => {
				// assign default value for changing column
				if (predicate.column.metadataType === MetadataType.OTHER) {
					predicate.operation = "match";
				} else {
					predicate.operation = "==";
				}
			}} />
	</div>
	<div class="selector">
		{#if predicate.column}
			{#if predicate.column.metadataType === MetadataType.BOOLEAN}
				<Svelecte
					value={predicate.operation}
					on:change={(e) => {
						predicate.operation = e.detail !== null ? e.detail.label : "==";
					}}
					valueField="label"
					placeholder={"Operation"}
					searchable={false}
					options={["==", "!="]} />
			{:else if predicate.column.metadataType === MetadataType.OTHER}
				<IdSearch
					col={$status.completeColumns.filter((d) => d.name === "id")[0]}
					bind:predicate />
			{:else}
				<Svelecte
					value={predicate.operation}
					on:change={(e) => {
						predicate.operation = e.detail !== null ? e.detail.label : "==";
					}}
					valueField="label"
					placeholder={"Operation"}
					searchable={false}
					options={operations} />
			{/if}
		{:else}
			<Svelecte options={operations} />
		{/if}
	</div>

	<div>
		{#if predicate.column}
			{#if predicate.column.metadataType === MetadataType.BOOLEAN}
				<Svelecte
					value={predicate.value + ""}
					on:change={(e) => {
						predicate.value = e.detail.label;
					}}
					valueField="label"
					placeholder={"Value"}
					searchable={false}
					options={["true", "false"]} />
			{:else if predicate.column.metadataType !== MetadataType.OTHER}
				<input type="text" bind:value={predicate.value} />
			{/if}
		{:else}
			<Svelecte />
		{/if}
	</div>
	<div class="selector">
		<IconButton
			on:click={deletePredicate}
			style="height:10px; margin-top: 5px; color: var(--G2)">
			<Icon component={Svg} viewBox="0 0 24 24">
				<path fill="currentColor" d={mdiTrashCanOutline} />
			</Icon>
		</IconButton>
	</div>
</div>

<style>
	.selector {
		margin-right: 10px;
	}
	#group {
		display: flex;
		flex-direction: inline;
		margin-bottom: 5px;
		margin-top: 5px;
	}
	input {
		height: 34px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	p {
		margin: 0px;
		margin-left: 5px;
		margin-top: 5px;
	}
</style>
