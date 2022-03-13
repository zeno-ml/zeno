<script lang="ts">
  import { results } from "./stores";
  import { LayerCake, Svg, Html } from "layercake";
  import Samples from "./samples/Samples.svelte";

  import AxisX from "./LayerCakeComponents/AxisX.svelte";
  import Strip from "./LayerCakeComponents/Strip.svelte";
  import Tooltip from "./LayerCakeComponents/Tooltip.svelte";
  import { slices } from "./stores";
  import * as aq from "arquero";

  import type ColumnTable from "arquero/dist/types/table/column-table";

  export let params: { id: string };

  let table: ColumnTable;
  let splitTables: ColumnTable[] = [];
  let evt;
  let res: Result;
  $: slice = res ? (slice = $slices.get(res.slice.join(""))) : "";
  results.subscribe((r) => {
    res = r.filter((d) => d.id === parseInt(params.id))[0];
  });

  let clicked: string[] = [];
  $: if (clicked.length > 2) {
    clicked.splice(1, 1);
    clicked = [...clicked];
  }
  $: if (
    clicked.length > 0 &&
    clicked.length < 3 &&
    splitTables.length !== clicked.length * clicked.length
  ) {
    clicked.forEach((model_hash) => {
      if (!table.columnNames().includes("model" + model_hash)) {
        fetch("/api/model_outputs/" + res.id + "/" + model_hash)
          .then((d) => d.json())
          .then((d) => {
            let model_outs = JSON.parse(d);
            table = table.assign(
              aq.table({
                ["metric" + model_hash]: model_outs.metric,
                ["model" + model_hash]: model_outs.output,
              })
            );
            updateSplitTables();
          });
      }
    });
    updateSplitTables();
  } else if (clicked.length === 0) {
    splitTables = [];
  }

  function updateSplitTables() {
    if (clicked.length === 1) {
      splitTables = [
        table.filter(aq.escape((d) => d["metric" + clicked[0]] === 1)),
        table.filter(aq.escape((d) => d["metric" + clicked[0]] === 0)),
      ];
    } else if (clicked.length === 2) {
      splitTables = [
        table.filter(
          aq.escape(
            (d) =>
              d["metric" + clicked[0]] === 1 && d["metric" + clicked[1]] === 1
          )
        ),
        table.filter(
          aq.escape(
            (d) =>
              d["metric" + clicked[0]] === 1 && d["metric" + clicked[1]] === 0
          )
        ),
        table.filter(
          aq.escape(
            (d) =>
              d["metric" + clicked[0]] === 0 && d["metric" + clicked[1]] === 1
          )
        ),
        table.filter(
          aq.escape(
            (d) =>
              d["metric" + clicked[0]] === 0 && d["metric" + clicked[1]] === 0
          )
        ),
      ];
    }
  }

  slices.subscribe((s) => {
    if (s.size > 0) {
      console.log(s, res.slice);
      let slice = s.get(res.slice.join(""));
      console.log(slice);
      if (!slice.table) {
        fetch("/api/table/" + slice.name.join(""))
          .then((d) => d.arrayBuffer())
          .then((d) => {
            table = aq.fromArrow(d);
            slice.table = table;
            s.set(res.slice.join(""), slice);
            slices.set(s);
          })
          .catch((e) => console.log(e));
      }
    }
  });
</script>

{#if res}
  <div id="header">
    <p>
      <b>slice:</b>
      {res.slice}
      {@html res.transform
        ? `<b style="padding-left:20px">transform: </b> ${res.transform}`
        : ""}
      <b style="padding-left: 20px;">metric:</b>
      {res.metric}
    </p>
  </div>
  <div id="bee">
    <LayerCake
      data={Object.keys(res.modelResults).map((model_hash, i) => ({
        model: res.modelNames[i],
        value: res.modelResults[model_hash],
        model_hash: model_hash,
      }))}
      x="value"
      z="model_hash"
      xDomain={[0, 100]}
    >
      <Html>
        {#if evt}
          <Tooltip {evt} let:detail>
            <p>model: {detail.props.model.split(/[\\/]/).pop()}</p>
            <p>metric: {detail.props.value.toFixed(2)}%</p>
          </Tooltip>
        {/if}
      </Html>
      <Svg>
        <Strip
          bind:clicked
          on:mouseout={() => (evt = "")}
          on:mousemove={(e) => (evt = e)}
        />
        <AxisX baseline={true} tickMarks={true} formatTick={(d) => d + "%"} />
      </Svg>
    </LayerCake>
  </div>
{/if}
<hr style="margin-top: 50px" />
{#if splitTables && splitTables.length === 2}
  <p>
    {res.modelNames[res.modelIds.indexOf(parseInt(clicked[0]))]
      .split(/[\\/]/)
      .pop()}
  </p>
  <div style="display: inline-flex">
    <div style="width: 50%">
      <p><b>Positive</b></p>
      <Samples
        id_col={slice.id_column}
        table={splitTables[0]}
        label_col={slice.label_column}
        output_col={"model" + clicked[0]}
      />
    </div>
    <div style="width: 50%">
      <p><b>Negative</b></p>
      <Samples
        id_col={slice.id_column}
        table={splitTables[1]}
        label_col={slice.label_column}
        output_col={"model" + clicked[0]}
      />
    </div>
  </div>
{:else if splitTables && splitTables.length === 4}
  <div style="display: inline-flex; align-items: center">
    <div>
      <p><b>Positive</b></p>
      <p style="margin-right: 20px;">
        {res.modelNames[res.modelIds.indexOf(parseInt(clicked[1]))]
          .split(/[\\/]/)
          .pop()}
      </p>
      <p><b>Negative</b></p>
    </div>
    <div>
      <p>
        {res.modelNames[res.modelIds.indexOf(parseInt(clicked[0]))]
          .split(/[\\/]/)
          .pop()}
      </p>
      <div style="display: inline-flex">
        <div style="width: 50%">
          <p><b>Positive</b></p>
          <Samples
            id_col={slice.id_column}
            label_col={slice.label_column}
            table={splitTables[0]}
            output_col={"model" + clicked[0]}
            second_output_col={"model" + clicked[1]}
          />
        </div>
        <div style="width: 50%">
          <p><b>Negative</b></p>
          <Samples
            id_col={slice.id_column}
            label_col={slice.label_column}
            table={splitTables[1]}
            output_col={"model" + clicked[0]}
            second_output_col={"model" + clicked[1]}
          />
        </div>
      </div>
      <div style="display: inline-flex">
        <div style="width: 50%">
          <Samples
            id_col={slice.id_column}
            label_col={slice.label_column}
            table={splitTables[2]}
            output_col={"model" + clicked[0]}
            second_output_col={"model" + clicked[1]}
          />
        </div>
        <div style="width: 50%">
          <Samples
            id_col={slice.id_column}
            label_col={slice.label_column}
            table={splitTables[3]}
            output_col={"model" + clicked[0]}
            second_output_col={"model" + clicked[1]}
          />
        </div>
      </div>
    </div>
  </div>
{:else if table}
  <Samples id_col={slice.id_column} label_col={slice.label_column} {table} />
{/if}

<style>
  #bee {
    width: 50%;
    height: 100px;
  }
</style>
