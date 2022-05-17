<script lang="ts">
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelACol;
  export let modelBCol;
</script>

{#each table as row}
  <div class="box">
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
    <span class="label">label: </span><span class="value">
      {row[$settings.labelColumn]}
    </span>
    {#if modelACol && row[modelACol]}
      <br />
      <span class="label">A: </span>
      <span class="value">{row[modelACol]} </span>
    {/if}
    {#if modelBCol && row[modelBCol]}
      <br />
      <span class="label">B: </span>
      <span class="value">{row[modelBCol]} </span>
    {/if}
  </div>
{/each}

<style>
  .label {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.5);
    font-variant: small-caps;
  }
  .value {
    font-size: 10px;
  }
  .box {
    padding: 10px;
    margin: 10px;
    border: 0.5px solid rgb(224, 224, 224);
  }
</style>
