<script>
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

  let showLabel = true;
  let showModel = true;

  let canvases = [];
  let imgs = [];

  console.log("mounted");
  drawImages();

  $: {
    table;
    showLabel;
    showModel;
    drawImages();
  }
  function drawImages() {
    console.log("draw");
    console.log(table);
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
            let boxes = table[i][labelColumn];
            ctx.strokeStyle = "purple";
            ctx.lineWidth = 3;
            boxes.forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
          if (t[modelColumn] && showModel) {
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 3;
            t[modelColumn].forEach((box) => {
              ctx.strokeRect(box[0], box[1], box[2], box[3]);
            });
          }
        }
      };
      img.src = `/data/${t[idColumn]}`;
      return img;
    });
  }
</script>

<div id="container">
  {#each table as row, i}
    <div class="box">
      <canvas
        style:max-width="200px"
        style:max-height="200px"
        bind:this={canvases[i]}
      />
    </div>
  {/each}
</div>

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .box {
    padding: 10px;
    margin: 10px;
    border: 0.5px solid rgb(224, 224, 224);
  }
</style>
