<script lang="ts">
  export let sli;
</script>

{#each sli.predicates as pred, i}
  <div class="meta-chip">
    <span>
      {pred.groupIndicator === "start" ? "(" : ""}
      {i === 0 ? "" : pred.join}
      {pred.name}
      {pred.operation}
      {!isNaN(Number(pred.value)) ? Number(pred.value).toFixed(2) : pred.value}
      {pred.groupIndicator === "end" ? ")" : ""}
    </span>
  </div>
{/each}

<style>
  .meta-chip {
    padding: 5px;
    background: rgba(0, 0, 0, 0.07);
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 2px;
    margin-bottom: 2px;
    border-radius: 5px;
    width: fit-content;
  }
</style>
