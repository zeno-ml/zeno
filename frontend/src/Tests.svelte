<script lang="ts">
  import { onMount } from "svelte";
  import Paper from "@smui/paper";

  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { testers } from "./stores";

  export let params = {};

  onMount(() => {
    fetch("/api/testers")
      .then((d) => d.json())
      .then((d) => testers.set(JSON.parse(d) as Tester[]));
  });

  testers.subscribe((d) => console.log(d));
</script>

<h2>Tests</h2>
<h5>Testing functions</h5>
{#each params.test ? $testers.filter((t) => t.name == params.test) : $testers as test}
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
