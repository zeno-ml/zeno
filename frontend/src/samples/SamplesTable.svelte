<script lang="ts">
  import * as aq from "arquero";

  export let entries;

  $: table = aq.fromArrow(entries.arrayBuffer());

  $: console.log(table);
</script>

<div class="container" />

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }
</style>
