<script lang="ts">
  import { mdiPause, mdiPlay } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import WaveSurfer from "wavesurfer.js";

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

  let divs = [];

  $: waves = divs.map((d, i) => {
    if (d) {
      d.innerHTML = "";
      let w = WaveSurfer.create({
        container: d,
        waveColor: "violet",
        progressColor: "purple",
        mediaControls: true,
        height: 50,
      });
      if (!transformColumn) {
        w.load(`/data/${table[i][idColumn]}`);
      } else {
        w.load(`/cache/${transformColumn}/${table[i][transformColumn]}`);
      }
      return w;
    }
  });
</script>

<div id="container">
  {#each table as row, i}
    <div class="box">
      <div style:display="flex">
        <IconButton
          on:click={() => {
            waves[i].isPlaying() ? waves[i].pause() : waves[i].play();
          }}
        >
          <Icon component={Svg} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d={waves[i] && waves[i].isPlaying() ? mdiPause : mdiPlay}
            />
          </Icon>
        </IconButton>
        <div
          style:width="150px"
          style:height="50px"
          bind:this={divs[i]}
          id={"wave_" + row[idColumn]}
        />
      </div>
      <br />
      <span class="label">label: </span><span class="value">
        {row[idColumn]}
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
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
