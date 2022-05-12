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
    getSliceTable,
    sendResultRequests,
    SliceNode,
  } from "./util";
  import { InternMap, InternSet } from "internmap";
  import LeafNode from "./LeafNode.svelte";
  import Filter from "./Filter.svelte";

  let modelA: string = "";
  let modelB: string = "";
  let selectedMetric: string = "";

  let filteredTable = aq.table({});
  let filter: string = "";
  let filterError: string = "";

  let selected: string = "";
  let checked: InternSet<string> = new InternSet();

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

  // $: if ($ready && modelA && selectedMetric && $slices.size > 0) {
  //   modelB;
  //   getResults([...$slices.values()]);
  // }

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
      let rKey = {
        slice: s.name,
        transform: "",
        metric: selectedMetric,
      } as ResultKey;
      let res: Result = $results.get(rKey);
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
      // if (!res || (res && !res.modelResults[modelA])) {
      //   requests.push({
      //     slice_name: s.name,
      //     idxs: t.array($settings.idColumn) as string[],
      //     metric: selectedMetric,
      //     model: modelA,
      //     transform: "",
      //   });
      // }
      // if (modelB && (!res || (res && !res.modelResults[modelB]))) {
      //   requests.push({
      //     slice_name: s.name,
      //     idxs: t.array($settings.idColumn) as string[],
      //     metric: selectedMetric,
      //     model: modelB,
      //     transform: "",
      //   });
      // }
    });
    sendResultRequests(requests);
  }

  function updateFilteredTable(t: ColumnTable) {
    if (!$ready) {
      return;
    }
    if (!selected) {
      filteredTable = $table.slice(100);
      return;
    }

    let slice = $slices.get(selected);
    if (slice.type === "programmatic") {
      filteredTable = t.filter(
        aq.escape((r) => r["zenoslice_" + slice.name] === 1)
      );
    } else {
      filteredTable = getSliceTable(selected, $settings.metadata, $table);
    }
  }

  function createSlice() {
    filterError = "";
    try {
      const newTable = getSliceTable(filter, $settings.metadata, $table);
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
          <!-- <div class="cell">
            {s.name}
          </div> -->
        {/each}
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
        {#each $settings.metadata as m}
          <div class="cell">
            {m} -
            {#if $table.column(m)}
              Unique values: {$table
                .rollup({ a: aq.op.array_agg_distinct(m) })
                .objects()[0]["a"].length}
            {/if}
          </div>
        {/each}
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
  .cell {
    height: 36px;
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: 400px;
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
</style>
