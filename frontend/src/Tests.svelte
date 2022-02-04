<script lang="ts">
  import { onMount } from "svelte";

  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";

  import { tests } from "./stores";

  export let params = {};

  onMount(() => {
    if ($tests.length === 0) {
      fetch("/api/tests")
        .then((d) => d.json())
        .then((d) => tests.set(JSON.parse(d)));
    }
  });
</script>

<h2>Tests</h2>
<h5>Testing functions</h5>
{#each $tests as code}
  <Highlight language={python} {code} />
{/each}
