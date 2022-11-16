<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import Button from "@smui/button";
	import Select, { Option } from "@smui/select";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Svg } from "@smui/common";
	import { mdiTrashCanOutline } from "@mdi/js";

	import FilterEntry from "./FilterEntry.svelte";

	export let predicateGroup: FilterPredicateGroup;
	export let deletePredicate: () => void;
	export let index;

	function deletePredicateLocal(i) {
		predicateGroup.predicates.splice(i, 1);
		if (predicateGroup.predicates.length === 0) {
			deletePredicate();
			return;
		}
		predicateGroup = predicateGroup;
	}
</script>

<div class="inline">
	<div class="column">
		{#if index > 0}
			<Select
				bind:value={predicateGroup.join}
				label="Join"
				style="margin-right: 20px; width: 90px">
				{#each ["AND", "OR"] as o}
					<Option value={o}>{o}</Option>
				{/each}
			</Select>
		{/if}
		{#if index > -1}
			<IconButton on:click={deletePredicate}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiTrashCanOutline} />
				</Icon>
			</IconButton>
		{/if}
	</div>
	<div id="main">
		<ul use:autoAnimate>
			{#each predicateGroup.predicates as p, i}
				{#if !("predicates" in p)}
					<li>
						<FilterEntry
							index={i}
							deletePredicate={() => deletePredicateLocal(i)}
							bind:predicate={p} />
					</li>
				{:else}
					<svelte:self
						index={i + 1 + index}
						deletePredicate={() => deletePredicateLocal(i)}
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
</div>

<style>
	.inline {
		display: flex;
	}
	#buttons {
		margin-bottom: 10px;
		margin-left: 40px;
	}
	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	#main {
		background: rgba(0, 0, 0, 0.025);
		border-radius: 5px;
		margin-top: 10px;
		margin-bottom: 10px;
	}
	ul {
		list-style-type: none;
		margin-right: 10px;
		margin-bottom: 0px;
	}
</style>
