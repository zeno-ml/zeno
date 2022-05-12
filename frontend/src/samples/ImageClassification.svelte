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
          {#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
      <br />
      <span class="label">{row[$settings.labelColumn]} </span>
      {#if modelACol && row[modelACol]}
        <br />
        <span class="output">A: {row[modelACol]} </span>
      {/if}
      {#if modelBCol && row[modelBCol]}
        <br />
        <span class="second_output">B: {row[modelBCol]} </span>
      {/if}
    </Paper>
  </div>
{/each}

<style>
  .label {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.75);
  }
  .output {
    font-size: 10px;
    color: rgb(155, 81, 224);
  }
  .second_output {
    font-size: 10px;
    color: rgba(4, 99, 7, 1);
  }
  .box {
    padding: 10px;
  }
</style>
