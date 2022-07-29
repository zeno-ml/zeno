<script lang="ts">
  import { onMount } from "svelte";
  import { csv } from "d3-fetch";

  import uPlot from "uplot";

  // List of objects with keys corresponding to the following props.
  export let table;
  // Key for model outputs.
  export let modelColumn;
  // Key for groundtruth labels.
  export let labelColumn;
  // Key for the input data.
  export let dataColumn;
  // Key for the transformed data (current transform).
  export let transformColumn;
  // Key for unique identifier of each item.
  export let idColumn;

  let divs = [];

  let colors = [
    "#ea5545",
    "#f46a9b",
    "#ef9b20",
    "#edbf33",
    "#ede15b",
    "#bdcf32",
    "#87bc45",
    "#27aeef",
    "#b33dc6",
  ];

  onMount(() => {
    table.forEach((row, i) => {
      csv("/data/" + row[dataColumn]).then((data) => {
        let dat = [];
        let series = [];
        [...Object.keys(data[0])].forEach((key, i) => {
          dat.push([]);

          if (i === 0) {
            series.push({ label: "x" });
          } else {
            series.push({
              label: key,
              stroke: colors[i % colors.length],
            });
          }

          data.forEach((row, j) => {
            dat[i][j] = parseFloat(row[key]);
          });
        });

        new uPlot(
          {
            id: "uplot-" + i,
            width: 400,
            height: 150,
            series: series,
            scales: { x: { time: false } },
          },
          dat,
          divs[i]
        );
      });
    });
  });
</script>

<div id="container">
  {#each table as row, i}
    <div bind:this={divs[i]} />
  {/each}
</div>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/uplot@1.6.21/dist/uPlot.min.css"
  />
</svelte:head>

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
