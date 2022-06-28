<script lang="ts">
  import Paper from "@smui/paper";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelCol;

  let showLabel = true;
  let showModel = true;

  let canvases: HTMLCanvasElement[] = [];
  let imgs: HTMLImageElement[] = [];
  $: {
    table;
    showLabel;
    showModel;
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
          if (t[modelCol] && showModel) {
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 3;
            t[modelCol].forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
        }
      };
      img.src = `/data/${t[$settings.idColumn]}`;
      return img;
    });
  }
</script>

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
