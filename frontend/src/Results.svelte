<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import Select, { Option } from "@smui/select";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";

  import { results } from "./stores";

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function runAnalysis() {
    if (runningAnalysis) return;
    runningAnalysis = true;

    let d = await fetch("/api/runanalysis", {
      method: "POST",
    });
    d = await d.json();
    let ready = false;
    while (!ready) {
      let r = await fetch("/api/getresults");
      r = await r.json();
      if (r.loading) {
        await sleep(1000);
      } else {
        ready = true;
        runningAnalysis = false;
        let res = JSON.parse(r);
        models = [];
        Object.keys(res[0]).forEach((d) => {
          if (d.startsWith("model_")) {
            models.push(d);
          }
        });
        tests = [...new Set(res.map((d) => d.test))];
        selectedTest = tests[0];
        results.set(res);
      }
    }
  }

  let runningAnalysis = false;
  let selectedTest = "";
  let models = [];
  let tests = [];
</script>

<h2>Results</h2>
<h5>Results of tests run on slices</h5>
<div>
  <Button on:click={() => runAnalysis()} variant="outlined">
    <Label>Run Analysis</Label>
  </Button>
  {#if runningAnalysis}
    <CircularProgress style="height: 32px; width: 32px;" indeterminate />
  {/if}
</div>
<div class="table-container">
  <Select bind:value={selectedTest} label="Select Metric">
    {#each tests as m}
      <Option value={m}>{m}</Option>
    {/each}
  </Select>
  <DataTable sortable table$aria-label="People list" style="max-width: 100%;">
    <Head>
      <Row>
        <Cell>Slice</Cell>
        <Cell>Test</Cell>
        <Cell>Size</Cell>
        {#each models as m}
          <Cell numeric><b>model:</b>{m.substring(6)}</Cell>
        {/each}
      </Row>
    </Head>
    <Body>
      {#each $results.filter((d) => d.test == selectedTest) as res}
        <Row>
          <Cell>{res.slice}</Cell>
          <Cell>{res.test}</Cell>
          <Cell numeric>{res.size}</Cell>
          {#each models as m}
            <Cell numeric>{res[m].toFixed(2)}%</Cell>
          {/each}
        </Row>
      {/each}
    </Body>
  </DataTable>
</div>

<style>
  .table-container {
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    width: fit-content;
  }
</style>
