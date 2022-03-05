<!--
  @component
  Generates an SVG Strip plot.
 -->
<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  const { data, xGet, z, height } = getContext("LayerCake");

  /** @type {number} [strokeWidth=1] - The circle's stroke width in pixels. */
  export let strokeWidth: number = 5;

  /** @type {string[]} [clicked=[]] - List of currently selected instances. */
  export let clicked: string[] = [];

  const dispatch = createEventDispatcher();
</script>

<g class="bee-group">
  {#each $data as d, i}
    <rect
      x={$xGet(d)}
      y={10}
      width={strokeWidth}
      height={$height - 20}
      fill={clicked[0] === $z(d)
        ? "red"
        : clicked[1] === $z(d)
        ? "purple"
        : "rgba(0, 0, 0, 0.5)"}
      on:mouseover={(e) => dispatch("mousemove", { e, props: $data[i] })}
      on:focus={(e) => dispatch("mousemove", { e, props: $data[i] })}
      on:mouseout={() => dispatch("mouseout", {})}
      on:blur={() => dispatch("mouseout", {})}
      on:click={() => {
        if (clicked.includes($z(d))) {
          clicked.splice(clicked.indexOf($z(d)), 1);
        } else {
          clicked.push($z(d));
        }
        clicked = [...clicked];
        dispatch("click", { props: $data[i] });
      }}
    />
  {/each}
</g>
