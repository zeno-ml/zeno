<script lang="ts">
  import Button from "@smui/button";
  import Select, { Option } from "@smui/select";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";
  import ResultCell from "./ResultCell.svelte";
  import Samples from "./samples/Samples.svelte";
  import { metrics, models, ready, results, slices, table } from "./stores";
  import { appendChild, SliceNode } from "./util";
  import { InternMap, InternSet } from "internmap";

  let modelA: string = "";
  let modelB: string = "";
  let selectedMetric: string = "";
  let filteredTable = aq.table({});

  $: console.log(filteredTable);
  ready.subscribe((r) => {
    if (r) {
      modelA = $models[0];
      selectedMetric = $metrics[0];
    }
  });

  let selected: string[][] = [];
  let checked: InternSet<string[][]> = new InternSet();
  let expandAll = false;

  let sliceTree: SliceNode = new SliceNode("root", 0, {});
  let comboSliceTree: SliceNode = new SliceNode("combinations", 0, {});

  $: if ($ready && modelA && selectedMetric && $slices.size > 0) {
    modelB;
    modelA;
    selectedMetric;
    getResults([...$slices.values()]);
  }

  slices.subscribe((sls) => {
    if (sls.size > 0 && modelA && selectedMetric) {
      setupTree(sls);
    }
  });

  table.subscribe((t) => updateFilteredTable(t));
  $: if (selected) {
    updateFilteredTable($table);
  }

  $: if (checked.size > 2) {
    checked.delete([...checked.values()][0]);
  }

  function setupTree(slices: InternMap<string[][], Slice>) {
    const slis: Slice[] = [...slices.values()];
    getResults(slis);
    let singleSlices = slis.filter((s) => s.name.length === 1);
    singleSlices.forEach((r) => {
      appendChild(sliceTree, r);
    });
    sliceTree = sliceTree;

    slis
      .filter((r) => r.name.length > 1)
      .forEach((r) => {
        console.log(r);
        let n = r.name.map((d: string[]) => d[d.length - 1]).join(" + ");
        comboSliceTree.children[n] = new SliceNode(n, 1, null, r);
      });
  }

  function getResults(sls: Slice[]) {
    // TODO: figure out weird update.
    if (!selectedMetric) {
      selectedMetric = $metrics[0];
    }

    // TODO: Check results and only request new ones if needed.
    let requests = [];
    sls.forEach((s) => {
      let rKey = {
        slice: s.name,
        transform: "",
        metric: selectedMetric,
      } as ResultKey;
      let res: Result = $results.get(rKey);
      if (!res || (res && !res.modelResults[modelA])) {
        requests.push({
          slices: s.name,
          metric: selectedMetric,
          model: modelA,
          transform: "",
        });
      }
      if (modelB && (!res || (res && !res.modelResults[modelB]))) {
        requests.push({
          slices: s.name,
          metric: selectedMetric,
          model: modelB,
          transform: "",
        });
      }
    });

    fetch("/api/analysis/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ requests: requests }),
    }).catch((e) => console.log(e));
  }

  function getResult() {
    getResults([
      {
        name: Array.from(checked.values()).map((s) => s[0]),
        size: 0,
      },
    ]);
  }

  function updateFilteredTable(t: ColumnTable) {
    if (selected.length === 0 || !$ready) {
      return;
    }
    let slice = $slices.get(selected);
    if (!slice) {
      return;
    }
    if (slice.name.length === 1) {
      filteredTable = t.filter(
        aq.escape((r) => r["zenoslice_" + slice.name[0].join("")] === 1)
      );
    } else if (slice.name.length > 1) {
      filteredTable = t;
      slice.name.forEach((s) => {
        filteredTable = filteredTable.filter(
          aq.escape((r) => r["zenoslice_" + s.join("")] === 1)
        );
      });
    }
  }
</script>

<div class="style-div">
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

<div id="container">
  {#if sliceTree}
    <div style:margin-right="10px">
      <div class="button-block">
        <Button variant="outlined" on:click={() => (expandAll = !expandAll)}>
          {expandAll ? "Collapse all" : "Expand all"}
        </Button>
        {#if checked.size > 0}
          <div style:margin-left="10px">
            <Button variant="outlined" on:click={() => getResult()}
              >New Slice</Button
            >
          </div>
        {/if}
      </div>
      {#each Object.values(sliceTree.children) as node}
        <ResultCell
          sliceNode={node}
          bind:selected
          bind:checked
          {expandAll}
          {modelA}
          {modelB}
          metric={selectedMetric}
        />
      {/each}
      {#if Object.keys(comboSliceTree.children).length > 0}
        <p>Combination Slices</p>
        {#each Object.values(comboSliceTree.children) as node}
          <ResultCell
            sliceNode={node}
            bind:selected
            bind:checked
            {expandAll}
            {modelA}
            {modelB}
            metric={selectedMetric}
          />
        {/each}
      {/if}
    </div>
  {/if}
  {#if selected && table}
    <div>
      <Samples modelACol={modelA} modelBCol={modelB} table={filteredTable} />
    </div>
  {/if}
</div>

<style>
  #container {
    margin-top: 20px;
    display: flex;
    flex-direction: row;
  }
  .style-div {
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
  }
  .button-block {
    display: flex;
    flex-direction: row;
    margin-left: 10px;
    margin-bottom: 10px;
  }
</style>
