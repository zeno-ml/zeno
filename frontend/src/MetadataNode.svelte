<script lang="ts">
  import { table } from "./stores";
  import { VegaLite } from "svelte-vega";
  import { countSpec, histogramSpec } from "./vegaSpecs";

  export let name;
  export let finalSelection;

  let selection = undefined;
  let spec = undefined;
  let view;

  const data = {
    table: [],
  };

  table.subscribe((t) => {
    if (t.column(name) && data.table.length === 0) {
      let vals = t.column(name).data;
      spec = isNaN(vals[0]) ? countSpec : histogramSpec;
      data.table = vals.map((d) => ({ val: d }));
    }
  });

  $: if (view) {
    if (spec === histogramSpec) {
      view.addSignalListener(
        "brush",
        (...s) => (selection = s[1].val ? ["range", ...s[1].val] : undefined)
      );
    } else {
      view.addSignalListener(
        "select",
        (...s) => (selection = s[1].val ? ["points", ...s[1].val] : undefined)
      );
    }
  }
</script>

<div class="cell">
  <div id="info">
    <span>{name}</span>
    {#if selection && selection[0] === "range"}
      <span>
        {selection ? selection[1].toFixed(2) + " - " : ""}
        {selection ? selection[2].toFixed(2) : ""}
      </span>
    {/if}
  </div>
  {#if $table.column(name) && spec}
    <div
      id="histogram"
      on:mouseup={() => (finalSelection = selection)}
      on:mouseout={() => (finalSelection = selection)}
      on:blur={() => (finalSelection = selection)}
    >
      <VegaLite
        {spec}
        bind:view
        {data}
        options={{ tooltip: true, actions: false, theme: "vox" }}
      />
    </div>
  {/if}
</div>

<style>
  .cell {
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: 400px;
    width: fit-content;
    display: flex;
    flex-direction: column;
  }
  #info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 14px;
    margin-left: 5px;
    margin-bottom: 5px;
    color: #666;
  }
</style>
