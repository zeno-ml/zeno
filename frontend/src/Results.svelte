<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Button from "@smui/button";
  import Select, { Option } from "@smui/select";
  import * as aq from "arquero";

  import { metrics, models, ready, settings, slices, table } from "./stores";
  import { getFilteredTable, updateResults } from "./util";

  import Samples from "./samples/Samples.svelte";
  import Slice from "./Slice.svelte";
  import Filter from "./Filter.svelte";
  import MetadataNode from "./MetadataNode.svelte";

  let model: string = "";
  let selectedMetric: string = "";

  let filteredTable = aq.table({});
  let filter: string = "";
  let filterError: string = "";

  let selected: string = "";
  let checked: Set<string> = new Set();
  let metadataSelections = [];

  ready.subscribe((r) => {
    if (r) {
      model = $models[0];
      selectedMetric = $metrics[0];
    }
  });
  table.subscribe((t) => updateFilteredTable(t));

  $: {
    selected;
    metadataSelections;
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

    metadataSelections.forEach((sel, i) => {
      if (sel) {
        let name;
        if (i >= $settings.metadata.length) {
          name = "zenomodel_" + model;
        } else {
          name = $settings.metadata[i];
        }

        if (sel[0] === "range") {
          tempTable = tempTable.filter(
            `(r) => r["${name}"] > ${sel[1]} && r["${name}"] < ${sel[2]}`
          );
        } else {
          tempTable = tempTable.filter(
            aq.escape((r) => aq.op.includes(sel.slice(1), r[name], 0))
          );
        }
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
      <Select
        bind:value={selectedMetric}
        label="Metric"
        style="margin-right: 20px;"
      >
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
          metric={selectedMetric}
          size={s.size}
          {model}
          bind:selected
          bind:checked
        />
      {/each}
    {/if}

    <h4>Metadata</h4>
    {#each $settings.metadata as name, i}
      <MetadataNode {name} bind:finalSelection={metadataSelections[i]} />
    {/each}

    {#if model}
      <h4>Outputs</h4>
      <MetadataNode
        name={"zenomodel_" + model}
        bind:finalSelection={metadataSelections[$settings.metadata.length]}
      />
    {/if}
  </div>

  {#if filteredTable}
    <div id="results">
      <Samples
        bind:checked
        {model}
        table={filteredTable}
        metric={selectedMetric}
      />
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
