<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import { Label } from "@smui/common";
  import { Pagination } from "@smui/data-table";
  import IconButton from "@smui/icon-button";
  import SegmentedButton, { Segment } from "@smui/segmented-button";
  import Select, { Option } from "@smui/select";

  import AudioClassification from "./AudioClassification.svelte";
  import ImageClassification from "./ImageClassification.svelte";
  import ObjectDetection from "./ObjectDetection.svelte";
  import TextClassification from "./TextClassification.svelte";

  import { ready, results, settings } from "../stores";

  export let modelA: string = "";
  export let modelB: string = "";
  export let metric: string;
  export let table: ColumnTable;

  let rowsPerPage = 15;
  let currentPage = 0;
  let viewOptions = ["list", "grid"];
  let view = "list";

  $: modelACol = "zenomodel_" + modelA;
  $: modelBCol = "zenomodel_" + modelB;

  $: start = currentPage * rowsPerPage;
  $: end = Math.min(start + rowsPerPage, table.size);
  $: lastPage = Math.max(Math.ceil(table.size / rowsPerPage) - 1, 0);
  $: if (currentPage > lastPage) {
    currentPage = lastPage;
  }

  $: resultA = $results.get({
    slice: "selection",
    metric: metric,
    model: modelA,
  } as ResultKey);
  $: resultB = $results.get({
    slice: "selection",
    metric: metric,
    model: modelB,
  } as ResultKey);
</script>

{#if table.size > 0}
  <div
    class="container"
    style:align-items="center"
    style:justify-content="space-between"
    style:margin-bottom="10px"
  >
    <div style:margin-left="10px">
      <span style:margin-right="10px">
        {resultA ? "A: " + resultA.toFixed(2) + "%" : ""}
      </span>
      <span>{resultB ? "B: " + resultB.toFixed(2) + "%" : ""}</span>
    </div>
    <SegmentedButton
      segments={viewOptions}
      let:segment
      singleSelect
      bind:selected={view}
    >
      <Segment {segment}>
        <Label>{segment}</Label>
      </Segment>
    </SegmentedButton>
  </div>
{/if}
{#if view === "list"}
  <div class="container sample-container">
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
{:else}
  <p>grid</p>
{/if}

<style global>
  .container {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    width: 100%;
  }
  .sample-container {
    height: calc(100vh - 280px);
    overflow-y: auto;
    align-content: baseline;
    border-bottom: 1px solid rgb(224, 224, 224);
    border-top: 1px solid rgb(224, 224, 224);
  }
</style>
