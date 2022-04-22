<script>
  import { onMount } from "svelte";
  import createScatterplot from "regl-scatterplot";
  import { models, table } from "./stores";
  import Select, { Option } from "@smui/select";
  import Button from "@smui/button";

  let scatterplot;
  let modelA = "";

  onMount(() => {
    const canvas = document.querySelector("#canvas");

    const { width, height } = canvas.getBoundingClientRect();

    scatterplot = createScatterplot({
      canvas,
      width,
      height,
      pointSize: 5,
    });

    if ($table.columnNames().includes("zenoembed_x")) {
      let x = t.column("zenoembed_x").data;
      let y = t.column("zenoembed_y").data;
      scatterplot.draw(x.map((x, i) => [x, y[i], "#f8f8f8"]));
    } else {
      const points = new Array(10000)
        .fill()
        .map(() => [-1 + Math.random() * 2, -1 + Math.random() * 2, "#f8f8f8"]);

      scatterplot.draw(points);
    }
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
    if (scatterplot) {
      if (t.columnNames().includes("zenoembed_x")) {
        let x = t.column("zenoembed_x").data;
        let y = t.column("zenoembed_y").data;
        scatterplot.clear();
        scatterplot.draw(x.map((x, i) => [x, y[i], "#f8f8f8"]));
      }
    }
  });
</script>

<div>
  {#if $models}
    <Select bind:value={modelA} label="Model A" style="margin-right: 20px;">
      {#each $models as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
    <Button on:click={runProjection}>Run Projection</Button>
  {/if}
</div>
<div>
  <canvas id="canvas" />
</div>

<style>
  #canvas {
    width: 500px;
    height: 500px;
  }
</style>
