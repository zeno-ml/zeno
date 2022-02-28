<script lang="ts">
  import type { View } from "svelte-vega";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import SegmentedButton, { Segment } from "@smui/segmented-button";
  import Select, { Option } from "@smui/select";
  import { Label } from "@smui/common";
  import { VegaLite } from "svelte-vega";
  import { LayerCake, Svg, Html } from "layercake";

  import { results, models, metric_names } from "./stores";
  import BeeswarmForce from "./BeeswarmForce.svelte";
  import AxisX from "./AxisX.svelte";
  import Tooltip from "./Tooltip.svelte";

  let selectedMetric = $metric_names[0];

  let views: View[] = [];
  $: {
    views.forEach((view) => {
      if (view) {
        view.width(500);
        view.height(50);
        view.runAsync();
      }
    });
  }

  let choices = ["table", "strip", "beeswarm"];
  let choice = "table";

  let evt = {};

  let schema = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: {
      type: "tick",
      thickness: 3,
      height: 30,
      tooltip: { content: "data" },
    },
    data: {
      name: "table",
    },
    encoding: {
      x: {
        field: "value",
        type: "quantitative",
        title: "",
        scale: {
          type: "linear",
          domain: [0, 1],
        },
        axis: {
          format: ".0%",
        },
      },
    },
  };
</script>

<div class="results-header">
  <h2>Results</h2>
  <div class="buttons-container">
    <Select
      bind:value={selectedMetric}
      label="Select Metric"
      style="margin-right: 20px;"
    >
      {#each $metric_names as m}
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
            <Cell numeric><b>model:</b>{m.substring(6)}</Cell>
          {/each}
        </Row>
      </Head>
      <Body>
        {#if $results.length > 0}
          {#each $results.filter((d) => d.metric == selectedMetric) as r}
            <Row on:click={() => (window.location.hash = "#/result/" + r.id)}>
              <Cell><a href="/#/slices/{r.slice}">{r.slice}</a></Cell>
              <Cell>{r.transform}</Cell>
              <Cell><a href="/#/tests/{r.metric}">{r.metric}</a></Cell>
              <Cell numeric>{r.sliceSize}</Cell>
              {#each $models as m}
                <Cell numeric>{r.modelResults[m].toFixed(2)}%</Cell>
              {/each}
            </Row>
          {/each}
        {/if}
      </Body>
    </DataTable>
  </div>
{:else if choice === "strip"}
  {#each $models as m, i}
    <p><i>{m}</i></p>
    <VegaLite
      bind:view={views[i]}
      spec={schema}
      data={{
        table: $results
          .filter((r) => r.metric == selectedMetric)
          .map((r) => ({
            slice: r.slice,
            value: (r.modelResults[m] / 100).toFixed(2),
            size: r.sliceSize,
          })),
      }}
      options={{ actions: false }}
    />
  {/each}
{:else if choice === "beeswarm"}
  {#each $models as m, i}
    <div id="bee-container">
      <LayerCake
        data={$results
          .filter((r) => r.metric == selectedMetric)
          .map((r) => ({
            slice: r.slice,
            value: (r.modelResults[m] / 100).toFixed(2),
            size: r.sliceSize,
          }))}
        x="value"
        z="slice"
        xDomain={[0, 1]}
      >
        <Html><Tooltip {evt} /></Html>
        <Svg>
          <BeeswarmForce r={6} on:mousemove={(d) => (evt = d)} />
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
    width: 100%;
    padding: 30px;
    height: 100px;
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
