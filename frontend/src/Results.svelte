<script lang="ts">
  import Button from "@smui/button";
  import Select, { Option } from "@smui/select";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";
  import ResultCell from "./ResultCell.svelte";
  import Samples from "./samples/Samples.svelte";
  import {
    metrics,
    models,
    ready,
    results,
    settings,
    slices,
    table,
  } from "./stores";
  import {
    appendChild,
    getFilteredTable,
    sendResultRequests,
    SliceNode,
  } from "./util";
  import { InternMap, InternSet } from "internmap";
  import LeafNode from "./LeafNode.svelte";
  import Filter from "./Filter.svelte";
  import MetadataNode from "./MetadataNode.svelte";

  let modelA: string = "";
  let modelB: string = "";
  let selectedMetric: string = "";

  let filteredTable = aq.table({});
  let filter: string = "";
  let filterError: string = "";

  let selected: string = "";
  let checked: InternSet<string> = new InternSet();
  let metadataSelections = [];

  let sliceTree: SliceNode = new SliceNode("root", 0, {});
  let comboSliceTree: SliceNode = new SliceNode("combinations", 0, {});

  ready.subscribe((r) => {
    if (r) {
      modelA = $models[0];
      selectedMetric = $metrics[0];
    }
  });
  slices.subscribe((sls) => {
    if (sls.size > 0 && modelA && selectedMetric) {
      setupTree(sls);
    }
  });
  table.subscribe((t) => updateFilteredTable(t));

  $: {
    selected;
    updateFilteredTable($table);
  }
  $: {
    metadataSelections;
    updateFilteredTable($table);
  }

  $: if (checked.size > 2) {
    checked.delete([...checked.values()][0]);
  }

  function setupTree(slices: InternMap<string, Slice>) {
    const slis: Slice[] = [...slices.values()];
    getResults(slis);
    let programmaticSlices = slis.filter((s) => s.type === "programmatic");
    programmaticSlices.forEach((r) => {
      appendChild(sliceTree, r);
    });
    sliceTree = sliceTree;
  }

  function getResults(sls: Slice[]) {
    // TODO: Check results and only request new ones if needed.
    let requests: ResultRequest[] = [];
    sls.forEach((s) => {
      let t = $table.filter(aq.escape((d) => d["zenoslice_" + s.name] === 1));
      $models.forEach((model) => {
        $metrics.forEach((metric) => {
          requests.push({
            slice_name: s.name,
            idxs: t.array($settings.idColumn) as string[],
            metric: metric,
            model: model,
            transform: "",
          });
        });
      });
    });
    sendResultRequests(requests);
  }

  function updateFilteredTable(t: ColumnTable) {
    if (!$ready) {
      return;
    }

    let tempTable = t;

    if (selected) {
      let slice = $slices.get(selected);
      if (slice.type === "programmatic") {
        tempTable = t.filter(
          aq.escape((r) => r["zenoslice_" + slice.name] === 1)
        );
      } else {
        tempTable = getFilteredTable(
          selected,
          $settings.metadata,
          $table,
          modelA,
          modelB
        );
      }
    }

    metadataSelections.forEach((sel, i) => {
      if (sel) {
        let name;
        if (i >= $settings.metadata.length) {
          name =
            i === $settings.metadata.length
              ? "zenomodel_" + modelA
              : "zenomodel_" + modelB;
        } else {
          name = $settings.metadata[i];
        }

        if (sel[0] === "range") {
          tempTable = tempTable.filter(
            aq.escape((r) => r[name] > sel[1] && r[name] < sel[2])
          );
        } else {
          tempTable = tempTable.filter(
            aq.escape((r) => aq.op.includes(sel.slice(1), r[name], 0))
          );
        }
      }
    });

    filteredTable = tempTable;
  }

  function createSlice() {
    filterError = "";
    try {
      const newTable = getFilteredTable(
        filter,
        $settings.metadata,
        $table,
        modelA,
        modelB
      );
      let requests = [];
      requests[0] = {
        slice_name: filter,
        idxs: newTable.array($settings.idColumn) as string[],
        metric: selectedMetric,
        model: modelA,
        transform: "",
      };
      if (modelB) {
        requests[1] = {
          slice_name: filter,
          idxs: newTable.array($settings.idColumn) as string[],
          metric: selectedMetric,
          model: modelA,
          transform: "",
        };
      }

      sendResultRequests(requests);
      filter = "";
    } catch (e) {
      filterError = e;
    }
  }
</script>

<div class="style-div">
  <div style:display="flex" style:flex-direction="inline">
    <div style:display="flex" style:flex-direction="column">
      <Filter bind:filter {createSlice} />
    </div>
    <Button on:click={createSlice}>Create Slice</Button>
    <span>{filterError}</span>
  </div>
  <div>
    {#if $metrics}
      <Select
        bind:value={selectedMetric}
        label="Select Metric"
        style="margin-right: 20px;"
      >
        {#each $metrics as m}
          <Option value={m}>{m}</Option>
        {/each}
      </Select>
    {/if}
    {#if $models}
      <Select bind:value={modelA} label="Model A" style="margin-right: 20px;">
        {#each $models as m}
          <Option value={m}>{m}</Option>
        {/each}
      </Select>
      <Select bind:value={modelB} label="Model B" style="margin-right: 20px;">
        {#each [...$models, ""] as m}
          <Option value={m}>{m}</Option>
        {/each}
      </Select>
    {/if}
  </div>
</div>

<div id="container">
  {#if sliceTree}
    <div class="side-container">
      <div style:margin-left="10px">
        {#if [...$slices.values()].filter((d) => d.type === "generated").length > 0}
          <h4>Generated Slices</h4>
          {#each [...$slices.values()].filter((d) => d.type === "generated") as s}
            <LeafNode
              name={s.name}
              fullName={s.name}
              result={$results.get({
                slice: s.name,
                transform: "",
                metric: selectedMetric,
              })}
              size={s.size}
              {modelA}
              {modelB}
              bind:selected
              bind:checked
            />
          {/each}
        {/if}
      </div>

      <h4 style:margin-left="10px">Slices</h4>
      {#if Object.keys(comboSliceTree.children).length > 0}
        <p>Generated Slices</p>
        {#each Object.values(comboSliceTree.children) as node}
          <ResultCell
            sliceNode={node}
            bind:selected
            bind:checked
            {modelA}
            {modelB}
            metric={selectedMetric}
          />
        {/each}
      {/if}
      {#each Object.values(sliceTree.children) as node}
        <ResultCell
          sliceNode={node}
          bind:selected
          bind:checked
          {modelA}
          {modelB}
          metric={selectedMetric}
        />
      {/each}

      <div style:margin-left="10px">
        <h4>Metadata</h4>
        {#each $settings.metadata as name, i}
          <MetadataNode {name} bind:finalSelection={metadataSelections[i]} />
        {/each}
        {#if modelA}
          <h4>Outputs</h4>
          <MetadataNode
            name={"zenomodel_" + modelA}
            bind:finalSelection={metadataSelections[$settings.metadata.length]}
          />
        {/if}
        {#if modelB}
          <MetadataNode
            name={"zenomodel_" + modelB}
            bind:finalSelection={metadataSelections[
              $settings.metadata.length + 1
            ]}
          />
        {/if}
      </div>
    </div>
  {/if}
  {#if filteredTable}
    <div id="results">
      <Samples
        modelACol={"zenomodel_" + modelA}
        modelBCol={"zenomodel_" + modelB}
        table={filteredTable}
      />
    </div>
  {/if}
</div>

<style>
  #results {
    margin-top: 10px;
    margin-right: 20px;
  }
  #container {
    display: flex;
    flex-direction: row;
  }
  .style-div {
    padding-bottom: 15px;
    padding-top: 15px;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .side-container {
    height: calc(100vh - 178px);
    overflow-y: scroll;
    min-width: 450px;
    padding-right: 35px;
    margin-right: 15px;
  }
</style>
