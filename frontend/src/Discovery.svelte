<script lang="ts">
  import MetadataBar from "./filtering/MetadataBar.svelte";
  import SelectionBar from "./filtering/SelectionBar.svelte";
  import { filteredTable } from "./stores";

  filteredTable.subscribe((d) => console.log(d));
</script>

<div id="main">
  <MetadataBar />
  <p>{$filteredTable.size}</p>
  <SelectionBar />
</div>

<style>
  #main {
    display: flex;
    flex-direction: row;
  }
</style>
