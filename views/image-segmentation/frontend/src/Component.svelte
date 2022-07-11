<script lang="ts">
  import SegmentedButton, { Label, Segment } from "@smui/segmented-button";

  let choices = ["Label", "Model"];
  let selected = ["Label"];

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

<div style:margin-left="10px">
  <SegmentedButton segments={choices} let:segment bind:selected>
    <Segment {segment}>
      <Label>{segment}</Label>
    </Segment>
  </SegmentedButton>
</div>
<div class="break" />
<div id="container">
  {#each table as row}
    <div class="box">
      <div id="overlays">
        <img
          src="/data/{row[idColumn]}"
          style:width="150px"
          style:height="150px"
          alt="Image thumbnail for instance {row[idColumn]}"
        />
        {#if selected.includes("Label")}
          <img
            class="overlay"
            src="/labels/{row[labelColumn]}"
            style:width="150px"
            style:height="150px"
            alt="Image thumbnail for instance {row[labelColumn]}"
          />
        {/if}
        {#if row[modelColumn] && selected.includes("Model")}
          <img
            class="overlay"
            src="/cache/{modelColumn}/{row[modelColumn]}"
            style:width="150px"
            style:height="150px"
            alt="Image thumbnail for instance {row[modelColumn]}"
          />
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  #overlays {
    position: relative;
  }
  .overlay {
    filter: invert(100%) opacity(40%);
    left: 0px;
    position: absolute;
  }
  .box {
    padding: 10px;
    margin: 10px;
    border: 0.5px solid rgb(224, 224, 224);
  }
  .break {
    flex-basis: 100%;
    height: 0;
  }
</style>
