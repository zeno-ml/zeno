<script lang="ts">
  import { filteredTable } from "./stores";

  import MetadataBar from "./filtering/MetadataBar.svelte";
  import SampleOptions from "./samples/SampleOptions.svelte";
  import Samples from "./samples/Samples.svelte";
</script>

<div id="container">
  <MetadataBar />

  {#if $filteredTable}
    <div style:margin-left="10px">
      <div id="sample-options">
        <SampleOptions />
      </div>
      <div id="samples">
        <Samples />
      </div>
    </div>
  {/if}
</div>

<style>
  #samples {
    margin-top: 10px;
    width: 100%;
    margin-right: 20px;
  }
  #sample-options {
    margin-top: 10px;
    width: 100%;
    min-height: 35px;
    margin-right: 20px;
  }
  #container {
    display: flex;
    flex-direction: row;
  }
</style>
