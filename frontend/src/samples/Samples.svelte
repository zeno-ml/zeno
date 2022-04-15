<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";
  import { Pagination } from "@smui/data-table";
  import Select, { Option } from "@smui/select";
  import IconButton from "@smui/icon-button";
  import { Label } from "@smui/common";

  import TextClassification from "./TextClassification.svelte";
  import ImageClassification from "./ImageClassification.svelte";
  import ObjectDetection from "./ObjectDetection.svelte";

  import { settings, ready } from "../stores";
  import AudioClassification from "./AudioClassification.svelte";

  export let modelACol: string = "";
  export let modelBCol: string = "";
  export let table: ColumnTable;

  let rowsPerPage = 15;
  let currentPage = 0;

  $: start = currentPage * rowsPerPage;
  $: end = Math.min(start + rowsPerPage, table.size);
  $: lastPage = Math.max(Math.ceil(table.size / rowsPerPage) - 1, 0);

  $: if (currentPage > lastPage) {
    currentPage = lastPage;
  }
</script>

{#if table.size > 0}
  <div>
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
        {start + 1}-{end} of {table.size}
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
  </div>
{/if}
<div class="container">
  {#if $ready}
    {#if $settings.task === "image-classification"}
      <ImageClassification
        table={table.slice(start, end).objects()}
        {modelACol}
        {modelBCol}
      />
    {:else if $settings.task === "object-detection"}
      <ObjectDetection
        table={table.slice(start, end).objects()}
        {modelACol}
        {modelBCol}
      />
    {:else if $settings.task === "text-classification"}
      <TextClassification
        table={table.slice(start, end).objects()}
        {modelACol}
        {modelBCol}
      />
    {:else if $settings.task === "audio-classification"}
      <AudioClassification
        table={table.slice(start, end).objects()}
        {modelACol}
        {modelBCol}
      />
    {/if}
  {/if}
</div>

<style global>
  .container {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    width: 100%;
  }
</style>
