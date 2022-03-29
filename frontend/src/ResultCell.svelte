<script lang="ts">
  import { type SliceNode, leafCount, isLeaf } from "./util";
  import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import { slide } from "svelte/transition";
  import IconButton, { Icon } from "@smui/icon-button";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Ripple from "@smui/ripple";
  import { results, slices } from "./stores";
  import { sliceEquals } from "./util";
  import type { InternSet } from "internmap";

  export let sliceNode: SliceNode;
  export let selected: string[][];
  export let checked: InternSet<string[][]>;
  export let modelA: string;
  export let modelB: string;
  export let expandAll: boolean = false;
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

  $: expandAll ? (expanded = true) : (expanded = false);
</script>

<div>
  <div transition:slide>
    {#if isLeaf(sliceNode)}
      <div
        use:Ripple={{ surface: true, color: "primary" }}
        class="cell parent {sliceEquals(selected, sliceNode.slice.name)
          ? 'selected'
          : ''}"
        style:margin-left={sliceNode.depth * 10 + "px"}
        on:click={() =>
          sliceEquals(selected, sliceNode.slice.name)
            ? (selected = [])
            : (selected = sliceNode.slice.name)}
      >
        <div class="group" style:width="100%">
          <div style:margin-right="5px">
            <FormField on:click={(e) => e.stopPropagation()}>
              <Checkbox
                checked={checked.has(sliceNode.slice.name)}
                on:click={() => {
                  checked.has(sliceNode.slice.name)
                    ? checked.delete(sliceNode.slice.name)
                    : checked.add(sliceNode.slice.name);
                  checked = checked;
                }}
              />
            </FormField>
          </div>
          <div class="group" style:width="100%">
            <span>{sliceNode.name}</span>
            {#if result}
              <div>
                <span style:margin-right="10px">
                  A: {result.modelResults[modelA]
                    ? result.modelResults[modelA].toFixed(2)
                    : ""}%
                  {#if modelB && result.modelResults[modelB]}
                    <span style:margin-left="10px">
                      B: {result.modelResults[modelB].toFixed(2)}%
                    </span>
                  {/if}
                </span>
                {#if slice}
                  <span>{slice.size.toLocaleString()}</span>
                {/if}
              </div>
            {/if}
          </div>
        </div>
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
            {expandAll}
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
  .selected {
    background: #ebdffc;
  }
</style>
