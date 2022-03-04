<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import Button from "@smui/button";

  export let id_col: string;
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
  {/each}

  <!-- {#if type == "table"}
    <SamplesTable {table} />
  {:else if type == "image"}
    <SamplesImages {table} />
  {/if} -->
</div>
