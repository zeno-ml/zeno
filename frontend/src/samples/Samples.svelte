<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import { Label } from "@smui/common";
  import { Pagination } from "@smui/data-table";
  import IconButton from "@smui/icon-button";
  import SegmentedButton, { Segment } from "@smui/segmented-button";
  import Select, { Option } from "@smui/select";
  import Chip, { Set as ChipSet, Text } from "@smui/chips";
  import Button from "@smui/button";

  import { scaleSequential } from "d3-scale";
  import { interpolatePurples } from "d3-scale-chromatic";

  import AudioClassification from "./AudioClassification.svelte";
  import ImageClassification from "./ImageClassification.svelte";
  import ObjectDetection from "./ObjectDetection.svelte";
  import TextClassification from "./TextClassification.svelte";

  import {
    ready,
    results,
    settings,
    slices,
    table as tableStore,
  } from "../stores";
  import { getFilteredTable, updateResults } from "src/util";

  export let modelA: string = "";
  export let modelB: string = "";
  export let metric: string;
  export let table: ColumnTable;
  export let checked: Set<string>;

  let rows = [];
  let columns = [];

  let rowsPerPage = 15;
  let currentPage = 0;
  let viewOptions = ["list", "grid"];
  let view = "list";
  let colorScale = scaleSequential(interpolatePurples).domain([0, 1]);

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

  let gridResults: number[][] = [];
  let gridSizes: number[][] = [];

  function getIdxs(slice_name: string) {
    let s = $slices.get(slice_name);
    if (s) {
      if (s.type === "programmatic") {
        return new Set(
          $tableStore
            .filter(`d => d["${"zenoslice_" + s.name}"] !== null`)
            .array($settings.idColumn) as string[]
        );
      } else {
        const newTable = getFilteredTable(
          s.name,
          $settings.metadata,
          $tableStore,
          modelA,
          modelB
        );
        return new Set(newTable.array($settings.idColumn) as string[]);
      }
    }
  }

  function getGridResults() {
    let rowIdxs = [];
    let columnIdxs = [];
    rows.forEach((r) => {
      rowIdxs.push(getIdxs(r));
      gridResults.push([]);
      gridSizes.push([]);
    });
    columns.forEach((c) => columnIdxs.push(getIdxs(c)));

    let requests = [];
    rowIdxs.forEach((rSet, r) => {
      columnIdxs.forEach((cSet, c) => {
        let reqIdxs = [...rSet].filter((element) => cSet.has(element));
        gridSizes[r][c] = reqIdxs.length;
        requests.push({
          sli: "zenogrid_" + r + "_" + c,
          idxs: reqIdxs,
        });
      });
    });
    updateResults(requests);
  }

  $: if (rows.length > 0 && columns.length > 0) {
    getGridResults();
  }

  results.subscribe((res) => {
    let min = 1;
    let max = 0;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        gridResults[r][c] = res.get({
          slice: "zenogrid_" + r + "_" + c,
          metric: metric,
          model: modelA,
        } as ResultKey);
        if (gridResults[r][c] > max) {
          max = gridResults[r][c];
        }
        if (gridResults[r][c] < min) {
          min = gridResults[r][c];
        }
      }
    }
    colorScale.domain([min, max]);
  });
</script>

{#if table.size > 0}
  <div class="options container">
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
  <div style:width="100%">
    <div class="inline">
      <span style:padding="10px">selected:</span>
      <ChipSet chips={[...checked.keys()]} let:chip nonInteractive>
        <Chip {chip}>
          <Text>{chip}</Text>
        </Chip>
      </ChipSet>
    </div>
    <div>
      <Button
        variant="outlined"
        on:click={() => {
          rows = [...checked.keys()];
          checked = new Set();
        }}>Set Rows</Button
      >
      <Button
        variant="outlined"
        on:click={() => {
          columns = [...checked.keys()];
          checked = new Set();
        }}>Set Columns</Button
      >
    </div>
    <table>
      <thead>
        <tr>
          <th>&nbsp;</th>
          {#each columns as c}
            <th>{c}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r, i}
          <tr>
            <td>{r}</td>
            {#each columns as c, j}
              {@const res = gridResults[i][j]}
              {@const size = gridSizes[i][j]}
              <td style:background-color={colorScale((100 - res) / 4)}>
                {res ? res.toFixed(2) + "%" : ""}
                ({size ? size : ""})
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  td {
    padding: 15px;
    margin: 5px;
  }
  th {
    padding: 20px;
  }
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
  }
  .inline {
    display: flex;
    flex-direction: inline;
    align-items: center;
  }
  .options {
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgb(224, 224, 224);
  }
</style>
