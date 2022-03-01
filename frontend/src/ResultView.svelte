<script lang="ts">
  import { results } from "./stores";
  import { LayerCake, Svg } from "layercake";

  import AxisX from "./AxisX.svelte";
  import BeeswarmForce from "./BeeswarmForce.svelte";

  export let params: { id: string };

  $: res = $results.filter((d) => d.id === parseInt(params.id))[0];
  console.log(res);
</script>

{#if res}
  <h1>{res.slice}</h1>
  <div id="bee">
    <LayerCake
      data={Object.keys(res.modelResults).map((model_name) => ({
        model: model_name,
        value: res.modelResults[model_name],
      }))}
      x="value"
      z="model"
      xDomain={[0, 100]}
    >
      <Svg>
        <BeeswarmForce r={6} />
        <AxisX baseline={true} tickMarks={true} formatTick={(d) => d + "%"} />
      </Svg>
    </LayerCake>
  </div>
{/if}

<!-- <LayerCake
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
      </LayerCake> -->
<style>
  #bee {
    width: 50%;
    height: 100px;
  }
</style>
