<script lang="ts">
  import Paper from "@smui/paper";

  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { metrics } from "./stores";

  export let params: { metric: string } = { metric: "" };
</script>

<h2>Tests</h2>
<h5>Testing functions</h5>
{#if $metrics.length > 0}
  {#each params.metric ? $metrics.filter((t) => t.name === params.metric) : $metrics as test}
    <Paper>
      <p>
        <b>{test.name}</b>
        <a href="/#/results?metrics={test.name}">see results</a>
      </p>
      <Highlight language={python} code={test.source} />
    </Paper>
    <br />
  {/each}
{/if}
