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
  export let selected;
  export let modelA;
  export let modelB;

  let expand = [];
  let checked = [];
  if (resultNode.children) {
    expand = new Array(Object.keys(resultNode.children).length).fill(false);
    checked = new Array(Object.keys(resultNode.children).length).fill(false);
  }
  console.log(resultNode);
</script>

<div>
  <div transition:slide>
    {#each Object.entries(resultNode.children) as [name, node], i}
      {#if isLeaf(node)}
        <div
          use:Ripple={{ surface: true, color: "primary" }}
          class="cell parent {selected === node.result.slice.join('')
            ? 'selected'
            : ''}"
          style:margin-left={node.depth * 10 + "px"}
          on:click={() =>
            selected === node.result.slice.join("")
              ? (selected = "")
              : (selected = node.result.slice.join(""))}
        >
          <div class="group" style:width="100%">
            <div style:margin-right="5px">
              <FormField on:click={(e) => e.stopPropagation()}>
                <Checkbox bind:checked={checked[i]} />
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
            <div style:margin-right="5px">
              <FormField on:click={(e) => e.stopPropagation()}>
                <Checkbox bind:checked={checked[i]} />
              </FormField>
            </div>
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
        {#if expand[i]}
          <svelte:self resultNode={node} bind:selected {modelA} {modelB} />
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
