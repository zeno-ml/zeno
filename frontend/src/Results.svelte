<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import SegmentedButton, { Segment } from "@smui/segmented-button";
  import Select, { Option } from "@smui/select";
  import { Label } from "@smui/common";
  import { LayerCake, Svg, Html } from "layercake";

  import { results, models, metrics } from "./stores";
  import BeeswarmForce from "./LayerCakeComponents/BeeswarmForce.svelte";
  import AxisX from "./LayerCakeComponents/AxisX.svelte";
  import Tooltip from "./LayerCakeComponents/Tooltip.svelte";
  import Strip from "./LayerCakeComponents/Strip.svelte";

  $: metric_names = $metrics.map((m) => m.name);
  $: selectedMetric = metric_names[0];

  let choices = ["table", "strip", "beeswarm"];
  let choice = "table";

  results.subscribe((d) => console.log(d));
  $: console.log(selectedMetric);
  $: console.log($metrics);

  let evt = [];
</script>

<div class="results-header">
  <h2>Results</h2>
  <div class="buttons-container">
    <Select
      bind:value={selectedMetric}
      label="Select Metric"
      style="margin-right: 20px;"
    >
      {#each metric_names as m}
        <Option value={m}>{m}</Option>
      {/each}
    </Select>
    <SegmentedButton
      segments={choices}
      let:segment
      singleSelect
      bind:selected={choice}
    >
      <Segment {segment}>
        <Label>{segment}</Label>
      </Segment>
    </SegmentedButton>
  </div>
</div>

{#if choice === "table"}
  <div class="table-container">
    <DataTable sortable table$aria-label="People list" style="max-width: 100%;">
      <Head>
        <Row>
          <Cell>Slice</Cell>
          <Cell>Transform</Cell>
          <Cell>Test</Cell>
          <Cell>Size</Cell>
          {#each $models as m}
            <Cell numeric><b>m:</b>{m.split(/[\\/]/).pop()}</Cell>
          {/each}
        </Row>
      </Head>
      <Body>
        {#if $results.length > 0}
          {#each $results.filter((d) => d.metric === selectedMetric) as r}
            <Row on:click={() => (window.location.hash = "#/result/" + r.id)}>
              <Cell><a href="/#/slices/{r.slice}">{r.slice}</a></Cell>
              <Cell>{r.transform}</Cell>
              <Cell><a href="/#/tests/{r.metric}">{r.metric}</a></Cell>
              <Cell numeric>{r.sliceSize}</Cell>
              {#each Object.keys(r.modelResults) as ent}
                <Cell numeric>{r.modelResults[ent].toFixed(2)}%</Cell>
              {/each}
            </Row>
          {/each}
        {/if}
      </Body>
    </DataTable>
  </div>
{:else if choice === "strip"}
  {#each $models as m, i}
    <div id="bee-container">
      <h5>{m.split(/[\\/]/).pop()}</h5>
      <LayerCake
        data={$results
          .filter((r) => r.metric === selectedMetric)
          .map((r) => ({
            slice: r.slice,
            value: r.modelResults[r.modelIds[i]].toFixed(2) / 100,
            size: r.sliceSize,
          }))}
        x="value"
        z="slice"
        xDomain={[0, 1]}
      >
        <Html>
          {#if evt[i]}
            <Tooltip evt={evt[i]} let:detail>
              <p>slice: {detail.props.slice}</p>
              <p>instances: {detail.props.size}</p>
            </Tooltip>
          {/if}
        </Html>
        <Svg>
          <Strip
            on:mouseout={() => (evt = [])}
            on:mousemove={(e) => (evt[i] = e)}
          />
          <AxisX
            baseline={true}
            tickMarks={true}
            formatTick={(d) => d * 100 + "%"}
          />
        </Svg>
      </LayerCake>
    </div>
  {/each}
{:else if choice === "beeswarm"}
  {#each $models as m, i}
    <div id="bee-container">
      <h5>{m}</h5>
      <LayerCake
        data={$results
          .filter((r) => r.metric === selectedMetric)
          .map((r) => ({
            slice: r.slice,
            value: r.modelResults[r.modelIds[i]].toFixed(2),
            size: r.sliceSize,
          }))}
        x="value"
        z="slice"
        xDomain={[0, 1]}
      >
        <Html>
          {#if evt[i]}
            <Tooltip evt={evt[i]} let:detail>
              <p>slice: {detail.props.slice}</p>
              <p>instances: {detail.props.size}</p>
            </Tooltip>
          {/if}
        </Html>
        <Svg>
          <BeeswarmForce
            r={6}
            on:mouseout={() => (evt = [])}
            on:mousemove={(e) => (evt[i] = e)}
          />
          <AxisX
            baseline={true}
            tickMarks={true}
            formatTick={(d) => d * 100 + "%"}
          />
        </Svg>
      </LayerCake>
    </div>
  {/each}
{/if}

<style>
  #bee-container {
    width: 50%;
    min-width: 400px;
    padding: 30px;
    height: 75px;
  }
  .table-container {
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    width: fit-content;
  }
  .results-header {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .buttons-container {
    display: flex;
    align-items: flex-end;
  }
</style>
