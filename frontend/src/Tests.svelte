<script lang="ts">
  import Button from "@smui/button";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";

  import Select, { Option } from "@smui/select";
  import { metrics, models, results, slices } from "./stores";

  interface Test {
    metric: string;
    slice: string;
    predicate: string;
  }

  let metric = $metrics[0];
  let slice = $slices[0];
  let predicate = "";
  let tests: Test[] = [];

  function createTest() {
    tests.push({
      metric: metric,
      slice: slice,
      predicate: predicate,
    });
    tests = tests;
    predicate = "";
  }
</script>

<Select bind:value={metric} label="Metric" style="margin-right: 20px;">
  {#each $metrics as m}
    <Option value={m}>{m}</Option>
  {/each}
</Select>
<Select bind:value={slice} label="Slice" style="margin-right: 20px;">
  {#each [...$slices.keys(), ""] as m}
    <Option value={m}>{m}</Option>
  {/each}
</Select>
<input
  bind:value={predicate}
  type="text"
  placeholder="Test, e.g. '> 70', '>= 21', etc."
/>
<Button on:click={createTest}>Create Test</Button>
<br />
<div id="table">
  <DataTable>
    <Head>
      <Row>
        <Cell>Slice</Cell>
        {#each $models as m}
          <Cell>{m}</Cell>
        {/each}
      </Row>
    </Head>
    <Body>
      {#each tests as t}
        <Row>
          <Cell>{t.slice}</Cell>
          {#each $models as m}
            {@const res = $results.get({
              slice: t.slice,
              transform: "",
              metric: t.metric,
            }).modelResults[m]}
            <Cell>
              <span class={eval(res + t.predicate) ? "correct" : "wrong"}>
                {res.toFixed(2)}
              </span>
            </Cell>
          {/each}
        </Row>
      {/each}
    </Body>
  </DataTable>
</div>

<style>
  #table {
    margin-top: 20px;
  }
  .correct {
    color: green;
  }
  .wrong {
    color: red;
  }
</style>
