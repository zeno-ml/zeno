<script lang="ts">
  import { TrailingIcon } from "@smui/chips";
  import Select, { Option } from "@smui/select";

  import {
    results,
    metadataSelections,
    metrics,
    models,
    metric,
    model,
    filteredTable,
    currentColumns,
    formattedCurrentColumns,
  } from "./stores";

  export let selected: string[];

  let sort = "";
  let group = "";

  $: result = $results.get({
    slice: "selection",
    metric: $metric,
    model: $model,
  } as ResultKey);
</script>

{#if $filteredTable.size > 0}
  <div id="options-container">
    <div class="options container">
      {#if $models}
        <Select bind:value={$model} label="Model" style="margin-right: 20px;">
          {#each $models as m}
            <Option value={m}>{m}</Option>
          {/each}
        </Select>
      {/if}
      {#if $metrics}
        <Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
          {#each $metrics as m}
            <Option value={m}>{m}</Option>
          {/each}
        </Select>
      {/if}
    </div>
    <div id="selects">
      <div class="select-div">
        <Select bind:value={sort} label="Sort By">
          {#each $currentColumns as m, i}
            <Option value={m}>{$formattedCurrentColumns[i]}</Option>
          {/each}
        </Select>
      </div>
      <div class="select-div">
        <Select bind:value={group} label="Group By">
          {#each $currentColumns as m, i}
            <Option value={m}>{$formattedCurrentColumns[i]}</Option>
          {/each}
        </Select>
      </div>
    </div>
  </div>
  <div class="chips">
    <span id="metric">
      {result ? result.toFixed(2) : ""}
    </span>
    {#each selected as s}
      <div class="meta-chip">
        {s}
        <TrailingIcon
          class="remove material-icons"
          on:click={() => {
            selected.splice(selected.indexOf(s), 1);
            selected = selected;
          }}
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
    {#if $metadataSelections.size > 0}
      <span class="clear" on:click={() => metadataSelections.set(new Map())}>
        clear all
      </span>
    {/if}
  </div>
{/if}

<style>
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
  #selects {
    display: flex;
    flex-direction: inline;
  }
  #options-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgb(224, 224, 224);
    margin-bottom: 10px;
    padding-bottom: 10px;
    margin-right: 20px;
  }
  .chips {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    align-items: center;
  }
  #metric {
    font-weight: 600;
    color: #6201ee;
    margin-right: 15px;
  }
  .options {
    align-items: center;
    justify-content: space-between;
  }
  .select-div {
    margin-left: 20px;
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
</style>
