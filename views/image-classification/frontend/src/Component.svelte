<script lang="ts">
  export let table;
  export let modelColumn;
  export let labelColumn;
  export let dataColumn;
  export let transformColumn;
  export let idColumn;

  let color = "white";
</script>

<div id="container">
  {#each table as row}
    <div class="box" style:background-color={color}>
      <img
        src="/data/{row[idColumn]}"
        style:max-width="200px"
        alt="Image thumbnail for instance {row[idColumn]}"
      />
      {#if transformColumn}
        <img
          src={`/cache/${transformColumn}/${row[transformColumn]}`}
          style:max-width="200px"
          alt="Image thumbnail for instance {row[transformColumn]}"
        />
      {/if}
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
