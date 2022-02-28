<script lang="ts">
  import { results } from "./stores";
  export let params: { id: string };

  $: console.log(parseInt(params.id));
  $: console.log($results);
  $: console.log($results.filter((d) => d.id === parseInt(params.id)));
  $: console.log(params);
</script>

<h1>hi</h1>
