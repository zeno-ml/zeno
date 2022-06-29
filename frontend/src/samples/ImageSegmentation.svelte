<script lang="ts">
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  import SegmentedButton, { Segment, Label } from "@smui/segmented-button";

  let choices = ["Label", "Model"];
  let selected = ["Label"];

  export let table;
  export let modelCol;
</script>

<div style:margin-left="10px">
  <SegmentedButton segments={choices} let:segment bind:selected>
    <Segment {segment}>
      <Label>{segment}</Label>
    </Segment>
  </SegmentedButton>
</div>
<div class="break" />
{#each table as row}
  <div class="box">
    <Wrapper>
      <div id="overlays">
        <img
          src="/data/{row[$settings.idColumn]}"
          style:width="150px"
          style:height="150px"
          alt="Image thumbnail for instance {row[$settings.idColumn]}"
        />
        {#if selected.includes("Label")}
          <img
            class="overlay"
            src="/labels/{row[$settings.labelColumn]}"
            style:width="150px"
            style:height="150px"
            alt="Image thumbnail for instance {row[$settings.labelColumn]}"
          />
        {/if}
        {#if row[modelCol] && selected.includes("Model")}
          <img
            class="overlay"
            src="/cache/{modelCol}/{row[modelCol]}"
            style:width="150px"
            style:height="150px"
            alt="Image thumbnail for instance {row[modelCol]}"
          />
        {/if}
      </div>
      <Tooltip>
        {#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
          {key} : {row[key]}
          <br />
        {/each}
      </Tooltip>
    </Wrapper>
  </div>
{/each}

<style>
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
