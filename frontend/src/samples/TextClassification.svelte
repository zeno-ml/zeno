<script lang="ts">
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelCol;
</script>

{#each table as row}
  <div class="box">
    <Wrapper>
      <span>{row[$settings.dataColumn]}</span>
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
    {#if modelCol && row[modelCol]}
      <br />
      <span class="label">pred: </span>
      <span class="value">{row[modelCol]} </span>
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
