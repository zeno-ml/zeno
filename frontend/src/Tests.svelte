<script lang="ts">
  import { onMount } from "svelte";
  import Paper from "@smui/paper";

  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { tests } from "./stores";

  export let params = {};

  onMount(() => {
    fetch("/api/tests")
      .then((d) => d.json())
      .then((d) => tests.set(JSON.parse(d)));
  });
</script>

<h2>Tests</h2>
<h5>Testing functions</h5>
{#each params.test ? Object.entries($tests).filter((ent) => ent[0] == params.test) : Object.entries($tests) as test}
  <Paper>
    <p>
      <b>{test[0]}</b> <a href="/#/results?metrics={test[0]}">see results</a>
      <!-- <a href={"/#/tests/" + test[0]}>{test[1].slices.length} slices</a> -->
    </p>
    <Highlight language={python} code={test[1]} />
  </Paper>
  <br />
{/each}
