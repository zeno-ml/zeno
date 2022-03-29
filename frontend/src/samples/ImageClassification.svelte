<script lang="ts">
  import Paper from "@smui/paper";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelACol;
  export let modelBCol;
</script>

{#each table as row}
  <div class="box">
    <Paper square>
      <Wrapper>
        <img
          src="/static/{row[$settings.idColumn]}"
          style:max-width="200px"
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
        <span class="output">A: {row[modelACol]} </span>
      {/if}
      {#if modelBCol}
        <br />
        <span class="second_output">B: {row[modelBCol]} </span>
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
