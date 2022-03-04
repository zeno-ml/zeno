<script lang="ts">
  import { fromArrow } from "arquero";

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
  let splitTables: [ColumnTable, ColumnTable];

  let evt;
  let res: Result;
  results.subscribe((r) => {
    res = r.filter((d) => d.id === parseInt(params.id))[0];
  });

  slices.subscribe((s) => {
    if (s.size > 0) {
      console.log(s.get(res.slice).table);
      let slice = s.get(res.slice);
      if (!slice.table) {
        fetch("/api/table/" + slice.name)
          .then((d) => d.arrayBuffer())
          .then((d) => {
            table = fromArrow(d);
            slice.table = table;
            s.set(res.slice, slice);
            slices.set(s);
          })
          .catch((e) => console.log(e));
      }
    }
  });

  function setClicked(e) {
    console.log(e.detail.props);
    fetch("/api/model_outputs/" + res.id + "/" + e.detail.props.model_hash)
      .then((d) => d.json())
      .then((d) => {
        let model_outs = JSON.parse(d);
        table = $slices
          .get(res.slice)
          .table.assign(aq.table({ ["model"]: model_outs }));
        splitTables = [
          table.filter((d) => d["model"] === 1),
          table.filter((d) => d["model"] === 0),
        ];
      });
  }
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
      z="model"
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
          on:mouseout={() => (evt = "")}
          on:mousemove={(e) => (evt = e)}
          on:click={(e) => setClicked(e)}
        />
        <AxisX baseline={true} tickMarks={true} formatTick={(d) => d + "%"} />
      </Svg>
    </LayerCake>
  </div>
{/if}
<hr style="margin-top: 50px" />
{#if splitTables}
  <div style="display: inline-flex">
    <div style="width: 50%">
      <h1>Positive</h1>
      <Samples id_col="id" table={splitTables[0]} />
    </div>
    <div style="width: 50%">
      <h1>Negative</h1>
      <Samples id_col="id" table={splitTables[1]} />
    </div>
  </div>
{:else if table}
  <h1>{res.slice}</h1>
  <Samples id_col="id" {table} />
{/if}

<style>
  #bee {
    width: 50%;
    height: 100px;
  }
</style>
