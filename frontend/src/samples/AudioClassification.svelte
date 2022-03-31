<script lang="ts">
  import Paper from "@smui/paper";
  import WaveSurfer from "wavesurfer.js";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";
  import Button from "@smui/button/src/Button.svelte";

  export let table;
  export let modelACol;
  export let modelBCol;

  let divs = [];

  $: waves = divs.map((d, i) => {
    if (d) {
      d.innerHTML = "";
      let w = WaveSurfer.create({
        container: d,
        waveColor: "violet",
        progressColor: "purple",
        mediaControls: true,
      });
      w.load(`/static/${table[i][$settings.idColumn]}`);
      return w;
    }
  });
</script>

{#each table as row, i}
  <div class="box">
    <Paper square>
      <Wrapper>
        <div
          style:width="300px"
          bind:this={divs[i]}
          id={"wave_" + row[$settings.idColumn]}
        />
        <Button
          on:click={() => {
            waves[i].isPlaying() ? waves[i].pause() : waves[i].play();
          }}>Play/Pause</Button
        >
        <!-- <audio
          src="/static/{row[$settings.idColumn]}"
          type="audio/wav"
          alt="Image thumbnail for instance {row[$settings.idColumn]}"
        /> -->
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
