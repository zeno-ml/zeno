<script lang="ts">
  import { onMount } from "svelte";
  import Paper from "@smui/paper";

  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { metrics } from "./stores";

  export let params = {};

  onMount(() => {
    fetch("/api/metrics")
      .then((d) => d.json())
      .then((d) => metrics.set(JSON.parse(d) as Tester[]));
  });

  metrics.subscribe((d) => console.log(d));
</script>

<h2>Tests</h2>
<h5>Testing functions</h5>
{#each params.metric ? $metrics.filter((t) => t.name == params.metric) : $metrics as test}
  <Paper>
    <p>
      <b>{test.name}</b>
      <a href="/#/results?metrics={test.name}">see results</a>
      <!-- <a href={"/#/tests/" + test[0]}>{test[1].slices.length} slices</a> -->
    </p>
    <Highlight language={python} code={test.source} />
  </Paper>
  <br />
{/each}
