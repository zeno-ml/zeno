<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import Select, { Option } from "@smui/select";

  import { results } from "./stores";

  let selectedTest = "";
  let models = [];
  let tests = [];

  let res = [];

  results.subscribe((d) => {
    if (d.data.length === 0) return;
    let r = JSON.parse(d.data);
    models = [];
    Object.keys(r[0]).forEach((d) => {
      if (d.startsWith("model_")) {
        models.push(d);
      }
    });
    tests = [...new Set(r.map((d) => d.test))];
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
        {#each res.filter((d) => d.test == selectedTest) as r}
          <Row>
            <Cell><a href="/#/slices/{r.slice}">{r.slice}</a></Cell>
            <Cell><a href="/#/tests/{r.test}">{r.test}</a></Cell>
            <Cell numeric>{r.size}</Cell>
            {#each models as m}
              <Cell numeric>{r[m].toFixed(2)}%</Cell>
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
