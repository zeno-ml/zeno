<script lang="ts">
  import Select, { Option } from "@smui/select";
  import ResultCell from "./ResultCell.svelte";
  import Samples from "./samples/Samples.svelte";

  import {
    metrics,
    models,
    results,
    slices,
    table,
    wsResponse,
  } from "./stores";
  import { ResultNode, appendChild } from "./util";

  import { fromArrow } from "arquero";
  import Button from "@smui/button";

  $: metric_names = $metrics.map((m) => m.name);
  $: selectedMetric = metric_names[0];

  let modelA;
  let modelB = "";
  models.subscribe((m) => (!modelA && m.length > 0 ? (modelA = m[0]) : ""));

  let selected = "";
  let checked: Map<string, string[]> = new Map();
  let resultHierarchy: ResultNode = new ResultNode("root", 0, {});
  let comboResults: ResultNode = new ResultNode("combinations", 0, {});
  let expandAll = false;
  let slice = {};
  $: slice = selected ? $slices.get(selected) : {};

  results.subscribe((res) => {
    if (res.length > 0) {
      const fullRes = res.filter(
        (r) => r.transform === "" && r.slice.length === 1
      );
      fullRes.forEach((r) => {
        appendChild(resultHierarchy, r);
      });
      resultHierarchy = resultHierarchy;

      res
        .filter((r) => r.transform === "" && r.slice.length > 1)
        .forEach((r) => {
          let n = r.slice.map((d: string[]) => d[d.length - 1]).join(" + ");
          comboResults.children[n] = new ResultNode(n, 1, null, r);
        });
    }
  });

  // TODO: Cache one table.
  $: if (selected && slice) {
    fetch("/api/table/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ name: slice.name }),
    })
      .then((d) => d.arrayBuffer())
      .then((d) => {
        table.set(fromArrow(d));
      })
      .catch((e) => console.log(e));
  }

  function requestSlice() {
    const request = {
      slices: [...checked.values()].map((d) => d[0]),
      metric: selectedMetric,
      model: modelA,
      transform: "",
    };
    fetch("/api/analysis/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ requests: [request] }),
    }).catch((e) => console.log(e));
  }
</script>

<div class="style-div">
  <Select
    bind:value={selectedMetric}
    label="Select Metric"
    style="margin-right: 20px;"
  >
    {#each metric_names as m}
      <Option value={m}>{m}</Option>
    {/each}
  </Select>
  {#if $models && modelA}
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
  {#if resultHierarchy}
    <div style:margin-right="10px">
      <div class="button-block">
        <Button variant="outlined" on:click={() => (expandAll = !expandAll)}>
          {expandAll ? "Collapse all" : "Expand all"}
        </Button>
        {#if checked.size > 0}
          <Button variant="outlined" on:click={() => requestSlice()}
            >New Slice</Button
          >
        {/if}
      </div>
      <ResultCell
        resultNode={resultHierarchy}
        bind:selected
        bind:checked
        {expandAll}
        {modelA}
        {modelB}
      />
      {#if Object.keys(comboResults.children).length > 0}
        <p>Combination Slices</p>
        <div>
          <ResultCell
            resultNode={comboResults}
            bind:selected
            bind:checked
            {expandAll}
            {modelA}
            {modelB}
          />
        </div>
      {/if}
    </div>
  {/if}
  {#if selected && table}
    <div>
      <Samples
        idCol={$wsResponse.id_column}
        labelCol={$wsResponse.label_column}
        modelACol={modelA}
        modelBCol={modelB}
        table={$table}
      />
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
