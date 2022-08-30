<script lang="ts">
	export let predicateGroup: FilterPredicateGroup;
</script>

<div class="chip">
	{#each predicateGroup.predicates as pred, i}
		{#if "predicates" in pred}
			<hr />
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
			<hr />
		{:else}
			<div class="meta-chip">
				{i === 0 ? "" : pred.join}
				{pred.column.name}
				{pred.operation}
				{!isNaN(Number(pred.value))
					? Number(pred.value).toFixed(2)
					: pred.value}
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
		border-radius: 5px;
	}
	hr {
		width: 100%;
		border: none;
	}
</style>
