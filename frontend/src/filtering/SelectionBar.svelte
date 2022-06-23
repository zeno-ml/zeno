<script lang="ts">
  import { TrailingIcon } from "@smui/chips";

  import {
    results,
    metric,
    model,
    metadataSelections,
    sliceSelections,
  } from "../stores";

  $: result = $results.get({
    slice: "",
    metric: $metric,
    model: $model,
  } as ResultKey);
</script>

<div class="chips">
  <span id="metric">
    {result ? result.toFixed(2) : ""}
  </span>
  {#each $sliceSelections as s}
    <div class="meta-chip">
      {s}
      <TrailingIcon
        class="remove material-icons"
        on:click={() =>
          sliceSelections.update((sel) => {
            sel.splice(sel.indexOf(s), 1);
            return sel;
          })}
      >
        cancel
      </TrailingIcon>
    </div>
  {/each}
  {#each [...$metadataSelections.entries()] as [col, chip]}
    <div class="meta-chip">
      <span>
        {#if chip.type === "range"}
          {chip.values[0].toFixed(2)}
          {"<"}
          {chip.name}
          {"<"}
          {chip.values[1].toFixed(2)}
        {:else if chip.type === "binary"}
          {chip.values[0]}
          {chip.name}
        {:else}
          {chip.name}
          {"=="}
          {chip.values.join(" | ")}
        {/if}
      </span>
      <TrailingIcon
        class="remove material-icons"
        on:click={() =>
          metadataSelections.update((m) => {
            m.delete(col);
            return m;
          })}>cancel</TrailingIcon
      >
    </div>
  {/each}
  {#if $metadataSelections.size + $sliceSelections.length > 0}
    <span
      class="clear"
      on:click={() => {
        metadataSelections.set(new Map());
        sliceSelections.set([]);
      }}
    >
      clear all
    </span>
  {/if}
</div>

<style>
  .chips {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    height: fit-content;
    align-items: center;
    min-height: 40px;
  }
  #metric {
    font-weight: 600;
    color: #6201ee;
    margin-right: 15px;
  }
  .meta-chip {
    padding: 5px;
    background: rgba(0, 0, 0, 0.07);
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 2px;
    margin-bottom: 2px;
    border-radius: 5px;
    width: fit-content;
  }
  .clear {
    padding: 5px;
    margin-left: 10px;
    cursor: pointer;
    color: #6200ee;
  }
  .clear:hover {
    background: #ede1fd;
    border-radius: 5px;
  }
</style>
