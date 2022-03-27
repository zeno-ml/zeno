<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import Button from "@smui/button";

  import { settings } from "../stores";

  export let modelACol: string = "";
  export let modelBCol: string = "";
  export let table: ColumnTable;

  $: console.log($settings, table.objects());

  let n = 20;
</script>

<Button
  on:click={() => (n += 10)}
  variant="outlined"
  style="margin-bottom: 20px;">See more</Button
>
<div class="container">
  {#each table.slice(0, n).objects() as row}
    <div class="box">
      <Wrapper>
        <img
          src="/static/{row[$settings.idColumn]}"
          alt="Image thumbnail for instance {row[$settings.idColumn]}"
        />
        <Tooltip>
          {#each Object.keys(row) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
      <br />
      <span class="label">{row[$settings.labelColumn]} </span>
      {#if modelACol}
        <br />
        <span class="output">{row[modelACol]} </span>
      {/if}
      {#if modelBCol}
        <br />
        <span class="second_output">{row[modelBCol]} </span>
      {/if}
    </div>
  {/each}

  <!-- {#if type == "table"}
    <SamplesTable {table} />
  {:else if type == "image"}
    <SamplesImages {table} />
  {/if} -->
</div>

<style>
  .container {
    display: flex;
    flex-direction: inline;
    flex-wrap: wrap;
    width: 100%;
  }
  .label {
    font-size: 9px;
    color: rgba(0, 0, 0, 0.5);
  }
  .output {
    font-size: 9px;
    color: rgba(255, 0, 0, 0.5);
  }
  .second_output {
    font-size: 9px;
    color: rgba(255, 0, 255, 0.5);
  }
  .box {
    padding: 10px;
  }
</style>
