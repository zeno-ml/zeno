<script lang="ts">
  export let table;
  export let modelColumn;
  export let labelColumn;
  export let dataColumn;
  export let transformColumn;
  export let idColumn;
</script>

<div id="container">
  {#each table as row}
    <p>{row[idColumn]}</p>
  {/each}
</div>

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
