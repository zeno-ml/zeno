<script lang="ts">
  import type { View, VegaLiteSpec } from "svelte-vega";

  import { VegaLite } from "svelte-vega";

  import { table } from "./stores";
  import { countSpec, histogramSpec } from "./vegaSpecs";

  export let name;
  export let finalSelection;

  let selection = undefined;
  let spec: VegaLiteSpec = undefined;
  let view: View;
  let data = { table: [] };

  function updateData(table) {
    if (spec && table.column(name)) {
      let vals = table.column(name).data;
      let d = vals.map((d) => ({ val: d }));
      data.table = d;
      data = data;
      if (view) {
        view.data("table", data.table);
        view.runAsync();
      }
    }
  }

  table.subscribe((t) => {
    if (t.column(name)) {
      let isOrdinal = isNaN(t.column(name).data[0]);
      let unique = t
        .rollup({ unique: `d => op.distinct(d["${name}"])` })
        .object().unique;

      if (isOrdinal) {
        spec = unique > 20 ? null : countSpec;
      } else {
        spec = unique < 20 ? countSpec : histogramSpec;
      }
    }
  });
  $: {
    name;
    view;
    updateData($table);
  }
  $: if (view && spec) {
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
    {#if $table.column(name) && !spec}
      <span style:margin-right="5px">
        unique values: {$table
          .rollup({ unique: `d => op.distinct(d["${name}"])` })
          .object().unique}
      </span>
    {/if}
  </div>
  {#if $table.column(name) && spec && data.table.length > 0}
    <div
      id="histogram"
      on:mouseup={() => (finalSelection = selection)}
      on:mouseout={() => (finalSelection = selection)}
      on:blur={() => (finalSelection = selection)}
    >
      <VegaLite
        {spec}
        {data}
        bind:view
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
