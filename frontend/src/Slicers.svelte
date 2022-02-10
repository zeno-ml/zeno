<script lang="ts">
  import Paper from "@smui/paper";
  import { onMount } from "svelte";
  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { slicers } from "./stores";

  onMount(() => {
    fetch("/api/slicers")
      .then((d) => d.json())
      .then((d) => slicers.set(JSON.parse(d)));
  });
</script>

<h2>Slicers</h2>
<h5>Slicing functions and sample instances</h5>
{#each Object.entries($slicers) as sli}
  <Paper>
    <p>
      <b>{sli[0]}</b>,
      <a href={"/#/slices/" + sli[0]}>{sli[1].slices.length} slices</a>
    </p>
    <Highlight language={python} code={sli[1].fn} />
  </Paper>
  <br />
{/each}
