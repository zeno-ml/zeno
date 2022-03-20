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

  $: metric_names = $metrics.map((m) => m.name);
  $: selectedMetric = metric_names[0];

  let modelA;
  let modelB = "";
  models.subscribe((m) => (!modelA && m.length > 0 ? (modelA = m[0]) : ""));

  let selected = "";
  let resultHierarchy: ResultNode = new ResultNode("root", 0, {});
  $: slice = selected ? (slice = $slices.get(selected)) : "";

  results.subscribe((res) => {
    if (res.length > 0) {
      res = res.filter((r) => r.transform === "");
      res.forEach((r) => {
        appendChild(resultHierarchy, r);
      });
      resultHierarchy = resultHierarchy;
    }
  });

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
      <ResultCell
        resultNode={resultHierarchy}
        bind:selected
        {modelA}
        {modelB}
      />
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
    margin-top: 30px;
    display: flex;
    flex-direction: row;
  }
  .style-div {
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
  }
</style>
