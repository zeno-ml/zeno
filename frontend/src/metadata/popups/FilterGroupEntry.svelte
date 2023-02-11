<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import { mdiTrashCanOutline } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Svelecte from "svelecte";
	import type { FilterPredicateGroup } from "../../zenoservice";
	import FilterEntry from "./FilterEntry.svelte";

	export let predicateGroup: FilterPredicateGroup;
	export let deletePredicate: () => void;
	export let index;

	function deletePredicateLocal(i) {
		predicateGroup.predicates.splice(i, 1);
		if (predicateGroup.predicates.length === 0) {
			deletePredicate();
			return;
		} else {
			predicateGroup.predicates[0].join = "";
		}
		predicateGroup = predicateGroup;
	}
</script>

<div class="group">
	<div class="group-join">
		{#if index > 0}
			<Svelecte
				placeholder={""}
				style={"width: 60px"}
				value={predicateGroup.join}
				on:change={(e) => {
					predicateGroup.join = e.detail.label;
					predicateGroup = predicateGroup;
				}}
				valueField="label"
				labelField="label"
				options={["&", "|"]} />
		{/if}
		{#if index > -1}
			<IconButton
				on:click={deletePredicate}
				style="min-width: 60px; color: var(--G2)">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiTrashCanOutline} />
				</Icon>
			</IconButton>
		{/if}
	</div>
	<div class="{index === -1 ? 'no-bg' : 'bg'} main ">
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
						join: predicateGroup.predicates.length === 0 ? "" : "&",
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
								join: "",
							},
						],
						join: predicateGroup.predicates.length === 0 ? "" : "&",
					});
					predicateGroup = predicateGroup;
				}}>
				add group
			</Button>
		</div>
	</div>
</div>

<style>
	.group {
		display: flex;
	}
	.group-join {
		margin-top: 5px;
		margin-right: 10px;
	}
	.no-bg {
		background: none;
		padding-left: 0px;
		margin-bottom: 0px;
	}
	.bg {
		margin-bottom: 10px;
		padding-left: 10px;
		background: rgba(0, 0, 0, 0.025);
	}
	#buttons {
		margin-bottom: 10px;
	}
	.main {
		border-radius: 4px;
		margin-top: 5px;
	}
	ul {
		list-style-type: none;
		margin-right: 10px;
		margin-bottom: 0px;
		padding-left: 0px;
	}
</style>
