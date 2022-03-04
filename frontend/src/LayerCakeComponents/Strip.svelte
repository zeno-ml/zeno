<!--
  @component
  Generates an SVG Strip plot.
 -->
<script>
  import { getContext } from "svelte";
  import { createEventDispatcher } from "svelte";

  const { data, xGet, height } = getContext("LayerCake");

  /** @type {Number} [strokeWidth=1] - The circle's stroke width in pixels. */
  export let strokeWidth = 5;

  const dispatch = createEventDispatcher();
</script>

<g class="bee-group">
  {#each $data as d, i}
    <rect
      x={$xGet(d)}
      y={10}
      width={strokeWidth}
      height={$height - 20}
      fill="rgba(0, 0, 0, 0.5)"
      on:mouseover={(e) => dispatch("mousemove", { e, props: $data[i] })}
      on:focus={(e) => dispatch("mousemove", { e, props: $data[i] })}
      on:mouseout={() => dispatch("mouseout", {})}
      on:blur={() => dispatch("mouseout", {})}
      on:click={() => dispatch("click", { props: $data[i] })}
    />
  {/each}
</g>
