<script lang="ts">
  import { Label } from "@smui/button";
  import { Pagination } from "@smui/data-table";
  import IconButton from "@smui/icon-button";
  import Select, { Option } from "@smui/select";

  import { filteredTable, model, ready, settings } from "../stores";

  import AudioClassification from "./AudioClassification.svelte";
  import ImageClassification from "./ImageClassification.svelte";
  import ImageSegmentation from "./ImageSegmentation.svelte";
  import ObjectDetection from "./ObjectDetection.svelte";
  import TextClassification from "./TextClassification.svelte";

  let rowsPerPage = 15;
  let currentPage = 0;

  $: modelCol = "zenomodel_" + $model;

  $: start = currentPage * rowsPerPage;
  $: end = Math.min(start + rowsPerPage, $filteredTable.size);
  $: lastPage = Math.max(Math.ceil($filteredTable.size / rowsPerPage) - 1, 0);
  $: if (currentPage > lastPage) {
    currentPage = lastPage;
  }
</script>

<div class="container sample-container">
  {#if $ready}
    {#if $settings.task === "image-classification"}
      <ImageClassification
        table={$filteredTable.slice(start, end).objects()}
        {modelCol}
      />
    {:else if $settings.task === "image-segmentation"}
      <ImageSegmentation
        table={$filteredTable.slice(start, end).objects()}
        {modelCol}
      />
    {:else if $settings.task === "object-detection"}
      <ObjectDetection
        table={$filteredTable.slice(start, end).objects()}
        {modelCol}
      />
    {:else if $settings.task === "text-classification"}
      <TextClassification
        table={$filteredTable.slice(start, end).objects()}
        {modelCol}
      />
    {:else if $settings.task === "audio-classification"}
      <AudioClassification
        table={$filteredTable.slice(start, end).objects()}
        {modelCol}
      />
    {/if}
  {/if}
</div>
<Pagination slot="paginate" class="pagination">
  <svelte:fragment slot="rowsPerPage">
    <Label>Rows Per Page</Label>
    <Select variant="outlined" bind:value={rowsPerPage} noLabel>
      <Option value={15}>15</Option>
      <Option value={30}>30</Option>
      <Option value={60}>60</Option>
      <Option value={100}>100</Option>
    </Select>
  </svelte:fragment>
  <svelte:fragment slot="total">
    {start + 1}-{end} of {$filteredTable.size}
  </svelte:fragment>

  <IconButton
    class="material-icons"
    action="first-page"
    title="First page"
    on:click={() => (currentPage = 0)}
    disabled={currentPage === 0}>first_page</IconButton
  >
  <IconButton
    class="material-icons"
    action="prev-page"
    title="Prev page"
    on:click={() => currentPage--}
    disabled={currentPage === 0}>chevron_left</IconButton
  >
  <IconButton
    class="material-icons"
    action="next-page"
    title="Next page"
    on:click={() => currentPage++}
    disabled={currentPage === lastPage}>chevron_right</IconButton
  >
  <IconButton
    class="material-icons"
    action="last-page"
    title="Last page"
    on:click={() => (currentPage = lastPage)}
    disabled={currentPage === lastPage}>last_page</IconButton
  >
</Pagination>

<style>
  .container {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    width: 100%;
  }
  .sample-container {
    height: calc(100vh - 250px);
    overflow-y: auto;
    align-content: baseline;
    border-bottom: 1px solid rgb(224, 224, 224);
  }
</style>
