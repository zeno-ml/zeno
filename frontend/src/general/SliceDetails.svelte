<script lang="ts">
	import type { FilterPredicateGroup } from "../zenoservice";

	export let predicateGroup: FilterPredicateGroup;
</script>

<div class="chip">
	{#each predicateGroup.predicates as pred, i}
		{#if "predicates" in pred}
			{#if i !== 0}
				<div class="meta-chip">
					{pred.join}
				</div>
			{/if}
			<div class="meta-chip">
				{"("}
			</div>
			<svelte:self predicateGroup={pred} />
			<div class="meta-chip">
				{")"}
			</div>
		{:else}
			{#if i !== 0}
				<div class="meta-chip">
					{pred.join}
				</div>
			{/if}
			<div class="meta-chip">
				{pred.column.name}
				{pred.operation}
				{#if !isNaN(Number(pred.value)) && typeof pred.value !== "boolean"}
					{Number(pred.value).toFixed(2)}
				{:else}
					{pred.value}
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.chip {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		width: fit-content;
	}
	.meta-chip {
		width: fit-content;
		padding: 5px;
		background: rgba(0, 0, 0, 0.07);
		margin-left: 5px;
		margin-right: 5px;
		margin-top: 2px;
		margin-bottom: 2px;
		border-radius: 5px;
	}
	hr {
		width: 100%;
		border: none;
	}
</style>
