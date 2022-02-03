<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import Select, { Option } from "@smui/select";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";
  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";
  import github from "svelte-highlight/src/styles/github";
  import * as aq from "arquero";
  import { select_option } from "svelte/internal";

  let models = [];
  let metrics = [];
  let metric = "";
  let results = [];

  let code = "";
  let test = "";

  let runningAnalysis = false;

  async function getResults() {
    let r = await fetch("/api/results");
    let results: Test[] = JSON.parse(await r.json());
    Object.keys(results[0]).forEach((d) => {
      if (d.startsWith("model_")) {
        models.push(d);
      }
    });
    metrics = [...new Set(results.map((d) => d.test))];
    metric = metrics[0];
    results = [...results];
  }

  getResults();

  fetch("/api/tests")
    .then((d) => d.json())
    .then((d) => {
      d = JSON.parse(d);
      d = d[0];
      console.log(d);
      test = d;
    });

  fetch("/api/slicers")
    .then((d) => d.json())
    .then((d) => {
      d = JSON.parse(d);
      d = d[0];
      console.log(d);
      code = d;
    });
  fetch("/api/data")
    .then((d) => d.arrayBuffer())
    .then((d) => {
      let data = aq.fromArrow(d);
      console.log(data.columnNames());
      console.log(data.totalRows());
    });

  function runAnalysis() {
    runningAnalysis = true;

    fetch("/api/runanalysis", {
      method: "POST",
    })
      .then((d) => d.json())
      .then((d) => {
        console.log(d);
      });

    setTimeout(() => {
      runningAnalysis = false;
    }, 1000);
  }
</script>

<svelte:head>
  {@html github}
</svelte:head>

<main>
  <h1>Results</h1>
  <Button on:click={() => runAnalysis()} variant="outlined">
    <Label>Run Analysis</Label>
  </Button>
  {#if runningAnalysis}
    <CircularProgress style="height: 32px; width: 32px;" indeterminate />
  {/if}
  {#if code.length > 0}
    <Highlight language={python} {code} />
  {/if}
  {#if test.length > 0}
    <Highlight language={python} code={test} />
  {/if}
  <div class="table-container">
    <Select bind:value={metric} label="Select Metric">
      {#each metrics as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
    <DataTable sortable table$aria-label="People list" style="max-width: 100%;">
      <Head>
        <Row>
          <Cell>Slice</Cell>
          <Cell>Test</Cell>
          <Cell numeric>Size</Cell>
          {#each models as m}
            <Cell numeric><b>model:</b>{m.substring(6)}</Cell>
          {/each}
        </Row>
      </Head>
      <Body>
        {#each results as res}
          <Row>
            <Cell>{res.slice}</Cell>
            <Cell>{res.test}</Cell>
            <Cell>{res.size}</Cell>
            {#each models as m}
              <Cell numeric>{res[m].toFixed(2)}%</Cell>
            {/each}
          </Row>
        {/each}
      </Body>
    </DataTable>
  </div>
</main>

<style>
  main {
    text-align: left;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .table-container {
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    width: fit-content;
  }
</style>
