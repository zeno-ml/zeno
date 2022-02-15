<script lang="ts">
  import { onMount } from "svelte";
  import SamplesImages from "./SamplesImages.svelte";
  import SamplesTable from "./SamplesTable.svelte";
  import { fromArrow } from "arquero";

  export let sli;

  let table;
  $: console.log(table ? table.objects() : "");

  onMount(() => {
    fetch("/api/sample/" + sli.name)
      .then((d) => d.arrayBuffer())
      .then((d) => (table = fromArrow(d)));
  });
</script>

<div class="container">
  {#if table}
    {#each table.objects() as row}
      <img src="/static/{row.id}" />
    {/each}
  {/if}

  <!-- {#if type == "table"}
    <SamplesTable {table} />
  {:else if type == "image"}
    <SamplesImages {table} />
  {/if} -->
</div>
