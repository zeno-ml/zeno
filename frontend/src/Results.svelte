<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Button from "@smui/button";
  import Select, { Option } from "@smui/select";
  import * as aq from "arquero";

  import {
    metadataSelections,
    metrics,
    models,
    ready,
    settings,
    slices,
    table,
  } from "./stores";
  import { getFilteredTable, updateResults } from "./util";

  import Samples from "./samples/Samples.svelte";
  import Slice from "./Slice.svelte";
  import Filter from "./Filter.svelte";
  import MetadataNode from "./MetadataNode.svelte";

  let model: string = "";
  let metric: string = "";

  let filteredTable = aq.table({});
  let filter: string = "";
  let filterError: string = "";

  let selected: string = "";
  let checked: Set<string> = new Set();

  ready.subscribe((r) => {
    if (r) {
      model = $models[0];
      metric = $metrics[0];
    }
  });
  table.subscribe((t) => updateFilteredTable(t));
  metadataSelections.subscribe(() => updateFilteredTable($table));

  $: {
    selected;
    updateFilteredTable($table);
  }

  function updateFilteredTable(t: ColumnTable) {
    if (!$ready) {
      return;
    }

    let tempTable = t;
    if (selected) {
      tempTable = getFilteredTable(selected, $settings.metadata, $table, model);
    }
    [...$metadataSelections.entries()].forEach((e) => {
      let [name, entry] = e;
      if (entry.type === "range") {
        tempTable = tempTable.filter(
          `(r) => r["${name}"] > ${entry.values[0]} && r["${name}"] < ${entry.values[1]}`
        );
      } else {
        if (typeof tempTable.column(name).get(0) === "bigint") {
          entry.values = entry.values.map((d) => BigInt(d));
        }
        tempTable = tempTable.filter(
          aq.escape((r) => aq.op.includes(entry.values, r[name], 0))
        );
      }
    });

    filteredTable = tempTable;
    updateResults([
      {
        sli: "selection",
        idxs: filteredTable.array($settings.idColumn) as string[],
      },
    ]);
  }

  function createSlice() {
    filterError = "";
    try {
      const newTable = getFilteredTable(
        filter,
        $settings.metadata,
        $table,
        model
      );
      updateResults([
        {
          sli: filter,
          idxs: newTable.array($settings.idColumn) as string[],
        },
      ]);
      slices.update((s) => {
        s.set(filter, {
          name: filter,
          size: newTable.size,
          type: "generated",
        });
        return s;
      });
      filter = "";
    } catch (e) {
      filterError = e;
    }
  }
</script>

<div class="style-div">
  <div style:display="flex" style:flex-direction="inline">
    <div
      style:margin-right="10px"
      style:display="flex"
      style:flex-direction="column"
    >
      <Filter bind:filter {createSlice} />
    </div>
    <Button variant="outlined" on:click={createSlice}>Create Slice</Button>
    <span>{filterError}</span>
  </div>
  <div>
    {#if $metrics}
      <Select bind:value={metric} label="Metric" style="margin-right: 20px;">
        {#each $metrics as m}
          <Option value={m}>{m}</Option>
        {/each}
      </Select>
    {/if}
    {#if $models}
      <Select bind:value={model} label="Model" style="margin-right: 20px;">
        {#each $models as m}
          <Option value={m}>{m}</Option>
        {/each}
      </Select>
    {/if}
  </div>
</div>

<div id="container">
  <div class="side-container">
    {#if [...$slices.values()].length > 0}
      <h4>Slices</h4>
      {#each [...$slices.values()] as s}
        <Slice
          name={s.name}
          fullName={s.name}
          {metric}
          size={s.size}
          {model}
          bind:selected
          bind:checked
        />
      {/each}
    {/if}

    <h4>Metadata</h4>
    {#each $settings.metadata.filter((m) => !m.startsWith("zeno")) as name, i}
      <MetadataNode {name} col={name} />
    {/each}

    <h4>Preprocessors</h4>
    {#each $settings.metadata.filter((m) => m.startsWith("zenopre")) as name, i}
      <MetadataNode name={name.slice(8)} col={name} />
    {/each}

    <h4>Postprocessors</h4>
    {#if model}
      {#each $settings.metadata.filter( (m) => m.startsWith("zenopost_" + model + "_") ) as name, i}
        <MetadataNode name={name.slice(10 + model.length)} col={name} />
      {/each}
    {/if}

    {#if model}
      <h4>Outputs</h4>
      <MetadataNode name={model} col={"zenomodel_" + model} />
    {/if}
  </div>

  {#if filteredTable}
    <div id="results">
      <Samples bind:checked {model} table={filteredTable} {metric} />
    </div>
  {/if}
</div>

<style>
  #results {
    margin-top: 10px;
    width: 100%;
    margin-right: 20px;
  }
  #container {
    display: flex;
    flex-direction: row;
  }
  .style-div {
    padding-bottom: 15px;
    padding-top: 5px;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .side-container {
    height: calc(100vh - 178px);
    overflow-y: auto;
    min-width: 450px;
    padding-right: 35px;
    margin-right: 15px;
  }
  h4 {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
  }
</style>
