<script lang="ts">
  import { type ResultNode, leafCount, isLeaf } from "./util";
  import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import { slide } from "svelte/transition";
  import IconButton, { Icon } from "@smui/icon-button";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Ripple from "@smui/ripple";

  export let resultNode: ResultNode;
  export let selected: string;
  export let checked: Map<string, string[]>;
  export let modelA: string;
  export let modelB: string;
  export let expandAll: boolean = false;

  let expand = [];
  if (resultNode.children) {
    expand = new Array(Object.keys(resultNode.children).length).fill(false);
  }
  $: if (checked.size > 2) {
    checked.delete([...checked.keys()][0]);
  }
</script>

<div>
  <div transition:slide>
    {#each Object.entries(resultNode.children) as [name, node], i}
      {#if isLeaf(node)}
        <div
          use:Ripple={{ surface: true, color: "primary" }}
          class="cell parent {selected ===
          node.result.slice.map((d) => d.join('')).join('')
            ? 'selected'
            : ''}"
          style:margin-left={node.depth * 10 + "px"}
          on:click={() =>
            selected === node.result.slice.map((d) => d.join("")).join("")
              ? (selected = "")
              : (selected = node.result.slice.map((d) => d.join("")).join(""))}
        >
          <div class="group" style:width="100%">
            <div style:margin-right="5px">
              <FormField on:click={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={checked.has(node.result.slice.join(""))}
                  on:click={() => {
                    checked.has(node.result.slice.join(""))
                      ? checked.delete(node.result.slice.join(""))
                      : checked.set(
                          node.result.slice.join(""),
                          node.result.slice
                        );
                    checked = new Map(checked);
                  }}
                />
              </FormField>
            </div>
            <div class="group" style:width="100%">
              <span>{name}</span>
              <div>
                <span style:margin-right="10px">
                  A: {node.result.modelResults[modelA].toFixed(2)}%
                  {#if modelB}
                    <span style:margin-left="10px">
                      B: {node.result.modelResults[modelB].toFixed(2)}%
                    </span>
                  {/if}
                </span>
                <span>{node.result.sliceSize.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="cell leaf" style="margin-left: {node.depth * 10}px">
          <div class="group">
            {name}
          </div>
          <div class="group">
            <span>{leafCount(node)}</span>
            <IconButton
              style="margin-left: 5px"
              size="button"
              on:click={() => (expand[i] = !expand[i])}
            >
              <Icon component={Svg} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d={expand[i] ? mdiChevronUp : mdiChevronDown}
                />
              </Icon>
            </IconButton>
          </div>
        </div>
        {#if expand[i] || expandAll}
          <svelte:self
            resultNode={node}
            bind:selected
            bind:checked
            {expandAll}
            {modelA}
            {modelB}
          />
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .cell {
    border: 1px solid #e0e0e0;
    /* border-radius: 4px; */
    padding: 10px;
    min-width: 350px;
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
