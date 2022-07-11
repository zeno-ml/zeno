<script lang="ts">
  // List of objects with keys corresponding to the following props.
  export let table;
  // Key for model outputs.
  export let modelColumn;
  // Key for groundtruth labels.
  export let labelColumn;
  // Key for the input data.
  export let dataColumn;
  // Key for the transformed data (current transform).
  export let transformColumn;
  // Key for unique identifier of each item.
  export let idColumn;
</script>

<div id="container">
  {#each table as row}
    <div class="box">
      <span>{row[dataColumn]}</span>
      <br />
      <span class="label">label: </span><span class="value">
        {row[labelColumn]}
      </span>
      {#if modelColumn && row[modelColumn]}
        <br />
        <span class="label">pred: </span>
        <span class="value">{row[modelColumn]} </span>
      {/if}
    </div>
  {/each}
</div>

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
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
