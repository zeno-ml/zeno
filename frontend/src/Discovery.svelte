<script lang="ts">
  import MetadataPanel from "./metadata/MetadataPanel.svelte";
  import SelectionBar from "./metadata/SelectionBar.svelte";
  import { filteredTable } from "./stores";
</script>

<div id="main">
  <MetadataPanel />
  <p>{$filteredTable.size}</p>
  <SelectionBar />
</div>

<style>
  #main {
    display: flex;
    flex-direction: row;
  }
</style>
