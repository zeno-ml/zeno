<script lang="ts">
  import { onMount } from "svelte";
  import createScatterplot from "regl-scatterplot";
  import { models, slices, table, settings } from "./stores";
  import Select, { Option } from "@smui/select";
  import Button from "@smui/button";
  import { scaleLinear, scaleOrdinal } from "d3-scale";
  import { op } from "arquero";
  import Samples from "./samples/Samples.svelte";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";

  let scatterplot;
  let filteredTable: ColumnTable = aq.table({});
  let modelA = "";
  let colorBy = "";
  let highlightBy = "";

  onMount(() => {
    const canvas: HTMLCanvasElement = document.querySelector("#canvas");

    const { width, height } = canvas.getBoundingClientRect();

    scatterplot = createScatterplot({
      canvas,
      width,
      height,
      pointSize: [15, 10],
      colorBy: "value1",
      opacityBy: "value2",
      sizeBy: "value2",
      opacity: [0.9, 0.5],
      pointColor: [
        "#4e79a7",
        "#f28e2c",
        "#e15759",
        "#76b7b2",
        "#59a14f",
        "#edc949",
        "#af7aa1",
        "#ff9da7",
        "#9c755f",
        "#bab0ab",
      ],
    });

    scatterplot.subscribe("select", (d) => {
      let baseTable = $table.assign(aq.table({ zenoid: $table.indices() }));
      let indexTable = aq.table({ zenoid: d.points });
      filteredTable = baseTable.join_right(indexTable, "zenoid");
    });

    scatterplot.subscribe("deselect", () => {
      filteredTable = $table.slice(0, 100);
    });
  });

  function runProjection() {
    fetch("/api/projection/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelA,
      }),
    });
  }

  table.subscribe((t) => {
    if (filteredTable.size === 0 && t) {
      filteredTable = t.slice(0, 100);
    }
    if (scatterplot && t.columnNames().includes("zenoembed_x")) {
      drawEmbed(t);
    }
  });

  $: if (colorBy && $table) {
    drawEmbed($table);
  }
  $: if (highlightBy && $table) {
    drawEmbed($table);
  }

  function drawEmbed(t) {
    let x = t.column("zenoembed_x");
    let y = t.column("zenoembed_y");

    let stats = t
      .rollup({
        x_min: op.min("zenoembed_x"),
        y_min: op.min("zenoembed_y"),
        x_max: op.max("zenoembed_x"),
        y_max: op.max("zenoembed_y"),
        x_median: op.median("zenoembed_x"),
        y_median: op.median("zenoembed_y"),
      })
      .object();

    scatterplot.set({
      xDomain: scaleLinear().domain([stats.x_min, stats.x_max]),
      yDomain: scaleLinear().domain([stats.y_min, stats.y_max]),
    });

    let colorCol = t.column(colorBy);
    let opacityCol = t.column("zenoslice_" + highlightBy);

    scatterplot.clear();
    let points = x.data.map((x, i) => [x, y.data[i]]);

    if (colorCol) {
      let colorStats = t
        .rollup({
          color_unique_count: op.distinct(colorBy),
          color_unique_vals: op.array_agg_distinct(colorBy),
        })
        .object();
      let colorScale = scaleOrdinal()
        .domain(colorStats.color_unique_vals)
        .range([...Array(colorStats.color_unique_count).keys()]);

      points = points.map((p, i) => [...p, colorScale(colorCol.get(i))]);
    } else {
      points = points.map((p) => [...p, 0]);
    }
    if (opacityCol) {
      points = points.map((p, i) => [...p, opacityCol.get(i) ? 0 : 1]);
    } else {
      points = points.map((p) => [...p, 0]);
    }
    scatterplot.draw(points);
    scatterplot.refresh();
  }
</script>

<div>
  {#if $models}
    <Select bind:value={modelA} label="Model A" style="margin-right: 20px;">
      {#each $models as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
    <Button on:click={runProjection}>Run Projection</Button>
    <Select bind:value={colorBy} label="Color by" style="margin-right: 20px;">
      {#each [...$settings.metadata, ""] as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
    <Select
      bind:value={highlightBy}
      label="Highlight by"
      style="margin-right: 20px;"
    >
      {#each [...$slices.keys(), ""] as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
  {/if}
</div>
<div id="container">
  <canvas id="canvas" />
  <div>
    <Samples modelACol={modelA} table={filteredTable} />
  </div>
</div>

<style>
  #container {
    display: flex;
    flex-direction: inline;
  }
  #canvas {
    width: 50%;
    height: 500px;
    border: 1px solid #e0e0e0;
  }
</style>
