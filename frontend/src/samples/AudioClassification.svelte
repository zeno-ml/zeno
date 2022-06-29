<script lang="ts">
  import WaveSurfer from "wavesurfer.js";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import { mdiPlay, mdiPause } from "@mdi/js";

  export let table;
  export let modelCol;

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
      w.load(`/data/${table[i][$settings.idColumn]}`);
      return w;
    }
  });
</script>

{#each table as row, i}
  <div class="box">
    <Wrapper>
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
          id={"wave_" + row[$settings.idColumn]}
        />
      </div>
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
