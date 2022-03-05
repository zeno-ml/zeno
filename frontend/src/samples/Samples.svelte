<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import Button from "@smui/button";

  export let id_col: string;
  export let label_col: string;
  export let output_col: string = "";
  export let second_output_col: string = "";
  export let table: ColumnTable;

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
          src="/static/{row[id_col]}"
          alt="Image thumbnail for instance {row[id_col]}"
        />
        <Tooltip>
          {#each Object.keys(row) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
      <br />
      <span class="label">{row[label_col]} </span>
      {#if output_col}
        <br />
        <span class="output">{row[output_col]} </span>
      {/if}
      {#if second_output_col}
        <br />
        <span class="second_output">{row[second_output_col]} </span>
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
