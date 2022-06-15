<script lang="ts">
  import type { View, VegaLiteSpec } from "svelte-vega";
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import { VegaLite } from "svelte-vega";

  import { metadataSelections, table } from "../stores";
  import { countSpec, histogramSpec } from "./vegaSpecs";

  export let name;
  export let col;

  let selection = undefined;
  let finalSelection = undefined;
  let spec: VegaLiteSpec = undefined;
  let view: View;
  let data = { table: [] };

  function updateData(table: ColumnTable) {
    if (spec && table.column(col)) {
      let arr = table.array(col);
      // Deal with BigInts.
      if (!isNaN(Number(arr[0]))) {
        arr = arr.map((d) => Number(d));
      }
      data = { table: arr };
    }
  }

  table.subscribe((t) => {
    if (t.column(col)) {
      let isOrdinal = isNaN(Number(t.column(col).get(0)));
      let unique = t
        .rollup({ unique: `d => op.distinct(d["${col}"])` })
        .object()["unique"];

      if (isOrdinal) {
        spec = unique > 20 ? null : countSpec;
      } else {
        spec = unique < 20 ? countSpec : histogramSpec;
      }
    }
  });

  $: {
    col;
    name;
    updateData($table);
  }

  metadataSelections.subscribe((m) => {
    if (!m.has(col) && view) {
      if (view.getState().signals["brush_data"]) {
        view.signal("brush", {});
        view.signal("brush_data", {});
        view.signal("brush_x", []);
        view.runAsync();
      }
      if (view.getState().signals["select_tuple"]) {
        view.signal("select", {});
        view.signal("select_modify", undefined);
        view.signal("select_toggle", false);
        view.signal("select_tuple", undefined);
        view.signal("highlight", {});
        view.signal("highlight_modify", undefined);
        view.signal("highlight_toggle", false);
        view.signal("highlight_tuple", undefined);
        view.runAsync();
      }
    }
  });

  $: if (view && spec) {
    if (spec === histogramSpec) {
      view.addSignalListener(
        "brush",
        (...s) => (selection = s[1].data ? ["range", ...s[1].data] : undefined)
      );
    } else {
      view.addSignalListener(
        "select",
        (...s) => (selection = s[1].data ? ["points", ...s[1].data] : undefined)
      );
    }
  }

  function setSelection() {
    if (selection === finalSelection) {
      return;
    }

    finalSelection = selection;
    metadataSelections.update((m) => {
      if (!finalSelection) {
        m.delete(col);
        return m;
      }
      m.set(col, {
        name: name,
        type: finalSelection[0],
        values: finalSelection.slice(1),
      });
      return m;
    });
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
    {#if $table.column(col) && !spec}
      <span style:margin-right="5px">
        unique values: {$table
          .rollup({ unique: `d => op.distinct(d["${col}"])` })
          .object()["unique"]}
      </span>
    {/if}
  </div>
  {#if data.table.length > 0}
    <div
      id="histogram"
      on:mouseup={setSelection}
      on:mouseout={setSelection}
      on:click={setSelection}
      on:blur={setSelection}
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
