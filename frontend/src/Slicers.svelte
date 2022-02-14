<script lang="ts">
  import Paper from "@smui/paper";
  import { onMount } from "svelte";
  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { slicers } from "./stores";

  slicers.subscribe((d) => console.log(d));

  onMount(() => {
    fetch("/api/slicers")
      .then((d) => d.json())
      .then((d) => slicers.set(JSON.parse(d) as Slicer[]));
  });
</script>

<h2>Slicers</h2>
<h5>Slicing functions and sample instances</h5>
{#each $slicers as sli}
  <Paper>
    <p>
      <b>{sli.name}</b>,
      <a href={"/#/slices/" + sli.name}>{sli.slices.length} slices</a>
    </p>
    <Highlight language={python} code={sli.source} />
  </Paper>
  <br />
{/each}
