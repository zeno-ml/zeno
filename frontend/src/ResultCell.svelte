<script lang="ts">
  import { type SliceNode, leafCount, isLeaf } from "./util";
  import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import { slide } from "svelte/transition";
  import IconButton, { Icon } from "@smui/icon-button";
  import { results, slices } from "./stores";
  import type { InternSet } from "internmap";
  import LeafNode from "./LeafNode.svelte";

  export let sliceNode: SliceNode;
  export let selected: string;
  export let checked: InternSet<string>;
  export let modelA: string;
  export let modelB: string;
  export let metric: string = "";

  let expanded: boolean = false;
  let result: Result = null;
  let slice: Slice = null;
  $: if (sliceNode.slice) {
    result = $results.get({
      slice: sliceNode.slice.name,
      transform: "",
      metric: metric,
    });
    slice = $slices.get(sliceNode.slice.name);
  }
</script>

<div>
  <div transition:slide>
    {#if isLeaf(sliceNode)}
      <div style:margin-left={sliceNode.depth * 10 + "px"}>
        <LeafNode
          name={sliceNode.name}
          fullName={sliceNode.slice.name}
          {result}
          size={sliceNode.slice.size}
          {modelA}
          {modelB}
          bind:selected
          bind:checked
        />
      </div>
    {:else}
      <div class="cell leaf" style="margin-left: {sliceNode.depth * 10}px">
        <div class="group">
          {sliceNode.name}
        </div>
        <div class="group">
          <span>{leafCount(sliceNode)}</span>
          <IconButton
            style="margin-left: 5px"
            size="button"
            on:click={() => (expanded = !expanded)}
          >
            <Icon component={Svg} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d={expanded ? mdiChevronUp : mdiChevronDown}
              />
            </Icon>
          </IconButton>
        </div>
      </div>
      {#if expanded}
        {#each Object.values(sliceNode.children) as child}
          <svelte:self
            sliceNode={child}
            bind:selected
            bind:checked
            {modelA}
            {modelB}
            {metric}
          />
        {/each}
      {/if}
    {/if}
  </div>
</div>

<style>
  .cell {
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: 400px;
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
</style>
