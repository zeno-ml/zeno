<script lang="ts">
	import { TrailingIcon } from "@smui/chips";

	import { selections } from "../../stores";
	import { MetadataType } from "../../globals";

	export let chip;
	export let hash;
</script>

<div class="meta-chip">
	<span>
		{#if chip[0].column.metadataType === MetadataType.CONTINUOUS}
			{parseFloat(chip[0].value).toFixed(2)}
			{"<="}
			{chip[0].column.name}
			{"<="}
			{parseFloat(chip[1].value).toFixed(2)}
		{:else if chip[0].column.metadataType === MetadataType.BOOLEAN}
			{chip[0].value}
			{chip[0].column.name}
		{:else if chip[0].column.metadataType === MetadataType.DATETIME}
			{#if !chip[0].value}
				start {chip[0].value.toLocaleString()}
			{:else if !chip[0].value}
				end {chip[0].value.toLocaleString()}
			{:else}
				from {chip[0].value.toLocaleString()} to {chip.values[1].toLocaleString()}
			{/if}
		{:else}
			{chip[0].column.name}
			{"=="}
			{chip.map((c) => c.value).join(" | ")}
		{/if}
	</span>
	<TrailingIcon
		class="remove material-icons"
		on:click={() =>
			selections.update((m) => ({
				slices: m.slices,
				metadata: {
					...m.metadata,
					[hash]: { predicates: [], join: "&" },
				},
			}))}>
		cancel
	</TrailingIcon>
</div>

<style>
	.meta-chip {
		padding: 5px;
		background: #f8f8f8;
		border: 1px solid #e8e8e8;
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
		width: fit-content;
	}
</style>
