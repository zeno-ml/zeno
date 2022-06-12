<script lang="ts">
  import { TrailingIcon } from "@smui/chips";

  import Ripple from "@smui/ripple";
  import { results, model, metric, slices } from "./stores";

  export let name: string;
  export let size: number;
  export let fullName = name;
  export let selected = false;
  export let setSelected;

  $: result = $results.get({
    slice: fullName,
    metric: $metric,
    model: $model,
  } as ResultKey);
</script>

<div
  use:Ripple={{ surface: true, color: "primary" }}
  class="cell parent {selected ? 'selected' : ''}"
  on:click={setSelected}
>
  <div class="group" style:width="100%">
    <div class="group" style:width="100%">
      <span>{name}</span>
      {#if result}
        <div>
          <span style:margin-right="10px">
            {result.toFixed(2)}
          </span>
          <span>({size.toLocaleString()})</span>
          <TrailingIcon
            class="delete-outline material-icons"
            on:click={() =>
              slices.update((s) => {
                s.delete(name);
                setSelected(name);
                return s;
              })}
          >
            delete-outline
          </TrailingIcon>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .cell {
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: 400px;
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .selected {
    background: #ebdffc;
  }
</style>
