<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import Button from "@smui/button";
	import FilterEntry from "./FilterEntry.svelte";

	export let predicateGroup: FilterPredicateGroup;
	export let deletePredicate: () => void;
	export let first;
</script>

<div id="main">
	<ul use:autoAnimate>
		{#each predicateGroup.predicates as p, i}
			{#if !("predicates" in p)}
				<li>
					<FilterEntry
						first={i === 0 ? true : false}
						deletePredicate={() => deletePredicate(i)}
						bind:predicate={p} />
				</li>
			{:else}
				<svelte:self
					first={i === 0 ? true : false}
					deletePredicate={() => deletePredicate(i)}
					bind:predicateGroup={p} />
			{/if}
		{/each}
	</ul>
	<div id="buttons">
		<Button
			color="secondary"
			on:click={() => {
				predicateGroup.predicates.push({
					column: undefined,
					operation: "",
					value: "",
					join: "AND",
				});
				predicateGroup = predicateGroup;
			}}>
			add filter
		</Button>
		<Button
			color="secondary"
			on:click={() => {
				predicateGroup.predicates.push({
					predicates: [
						{
							column: undefined,
							operation: "",
							value: "",
							join: "AND",
						},
					],
					join: "AND",
				});
				predicateGroup = predicateGroup;
			}}>
			add group
		</Button>
	</div>
</div>

<style>
	#buttons {
		margin: 5px;
		padding: 10px;
	}
	#main {
		background: rgba(0, 0, 0, 0.025);
		border-radius: 5px;
		margin-top: 10px;
	}
	ul {
		list-style-type: none;
		margin-right: 10px;
	}
</style>
