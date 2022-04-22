<script lang="ts">
  import Paper from "@smui/paper";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelACol;
  export let modelBCol;

  let showLabel = true;
  let showModelA = true;
  let showModelB = true;

  let canvases: HTMLCanvasElement[] = [];
  let imgs: HTMLImageElement[] = [];
  $: {
    table;
    showLabel;
    showModelA;
    showModelB;
    drawImages();
  }
  function drawImages() {
    imgs = table.map((t, i) => {
      let img = new Image();
      img.style.maxHeight = "200px";
      img.style.maxWidth = "200px";
      img.onload = () => {
        if (canvases[i]) {
          canvases[i].width = img.width;
          canvases[i].height = img.height;
          let ctx = canvases[i].getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0);
          if (showLabel) {
            let boxes = table[i][$settings.labelColumn];
            ctx.strokeStyle = "purple";
            ctx.lineWidth = 3;
            boxes.forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
          if (t[modelACol] && showModelA) {
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 3;
            t[modelACol].forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
          if (t[modelBCol] && showModelB) {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 3;
            t[modelACol].forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
        }
      };
      img.src = `/static/${t[$settings.idColumn]}`;
      return img;
    });
  }
</script>

<div>
  <!-- <FormField>
    <Checkbox bind:showLabel />
    <span slot="label">label</span>
  </FormField>
  <FormField>
    <Checkbox bind:showModelA />
    <span slot="label">model A</span>
  </FormField>
  <FormField>
    <Checkbox bind:showModelB />
    <span slot="label">model B</span>
  </FormField> -->
</div>
<br />
{#each table as row, i}
  <div class="box">
    <Paper square>
      <Wrapper>
        <canvas
          style:max-width="200px"
          style:max-height="200px"
          bind:this={canvases[i]}
        />
        <Tooltip>
          {#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
    </Paper>
  </div>
{/each}

<style>
  .box {
    padding: 10px;
  }
</style>
