<script lang="ts">
  import Select, { Option } from "@smui/select";
  import ResultCell from "./ResultCell.svelte";
  import Samples from "./samples/Samples.svelte";

  import { metrics, models, results, slices } from "./stores";
  import { ResultNode, appendChild } from "./util";

  import { fromArrow } from "arquero";

  $: metric_names = $metrics.map((m) => m.name);
  $: selectedMetric = metric_names[0];

  $: modelA = $models[0];
  $: modelB = "";

  let selected = "";
  let resultHierarchy: ResultNode = new ResultNode("root", 0, {});
  $: slice = selected ? (slice = $slices.get(selected)) : "";

  results.subscribe((res) => {
    if (res.length > 0) {
      res.forEach((r) => {
        appendChild(resultHierarchy, r);
      });
      resultHierarchy = resultHierarchy;
    }
  });

  let table;
  $: if (selected) {
    // TODO: cache this table in results
    if (!slice.table) {
      fetch("/api/table/" + selected)
        .then((d) => d.arrayBuffer())
        .then((d) => {
          table = fromArrow(d);
          slice.table = table;
          $slices.set(selected, slice);
          slices.set($slices);
        })
        .catch((e) => console.log(e));
    } else {
      table = slice.table;
    }
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
</div>

<div id="container">
  {#if resultHierarchy}
    <div style:margin-right="10px">
      <ResultCell resultNode={resultHierarchy} bind:selected />
    </div>
  {/if}
  {#if selected && table}
    <div>
      <Samples
        id_col={slice.id_column}
        label_col={slice.label_column}
        {table}
      />
    </div>
  {/if}
</div>

<style>
  #container {
    margin-top: 30px;
    margin: 10px;
    display: flex;
    flex-direction: row;
  }
  .style-div {
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
  }
</style>
