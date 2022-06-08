<script lang="ts">
  import Paper from "@smui/paper";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelCol;
</script>

{#each table as row}
  <div class="box">
    <Paper square>
      <Wrapper>
        <span style:max-width="300px">{row["content"]}</span>
        <Tooltip>
          {#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
      <br />
      <span class="label">{row[$settings.labelColumn]} </span>
      {#if modelCol}
        <span class="output">A: {row[modelCol]} </span>
      {/if}
    </Paper>
  </div>
{/each}

<style>
  .label {
    font-size: 9px;
    color: rgba(0, 0, 0, 0.5);
  }
  .output {
    margin-left: 10px;
    font-size: 12px;
    color: rgba(255, 0, 0, 0.5);
  }
  .box {
    padding: 10px;
  }
</style>
