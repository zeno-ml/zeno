<script lang="ts">
  export let sli: Slice;
</script>

<div class="chip">
  {#each sli.filterPredicates as pred, i}
    <div class="meta-chip">
      {pred.groupIndicator === "start" ? "(" : ""}
      {i === 0 ? "" : pred.join}
      {pred.name}
      {pred.operation}
      {!isNaN(Number(pred.value)) ? Number(pred.value).toFixed(2) : pred.value}
      {pred.groupIndicator === "end" ? ")" : ""}
    </div>
  {/each}
</div>

<style>
  .chip {
    display: flex;
    flex-direction: row;
  }
  .meta-chip {
    width: fit-content;
    padding: 5px;
    background: rgba(0, 0, 0, 0.07);
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 2px;
    margin-bottom: 2px;
    border-radius: 5px;
  }
</style>
