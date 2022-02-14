<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import Select, { Option } from "@smui/select";

  import { wsResponse } from "./stores";

  let selectedTest = "";
  let models = [];
  let tests = [];

  let res: Result[] = [];

  wsResponse.subscribe((d: WSResponse) => {
    let r = JSON.parse(d.results) as Result[];
    if (r.length === 0) return;
    console.log(d.results, r);
    models = [];
    Object.keys(r[0].modelResults).forEach((d) => {
      if (d.startsWith("model_")) {
        models.push(d);
      }
    });
    tests = [...new Set(r.map((d) => d.testerName))];
    selectedTest = tests[0];
    res = r;
  });
</script>

<h2>Results</h2>
<h5>Results of tests run on slices</h5>
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
      {#if res.length > 0}
        {#each res.filter((d) => d.testerName == selectedTest) as r}
          <Row>
            <Cell><a href="/#/slices/{r.sliceName}">{r.sliceName}</a></Cell>
            <Cell><a href="/#/tests/{r.testerName}">{r.testerName}</a></Cell>
            <Cell numeric>{r.sliceSize}</Cell>
            {#each models as m}
              <Cell numeric>{r.modelResults[m].toFixed(2)}%</Cell>
            {/each}
          </Row>
        {/each}
      {/if}
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
