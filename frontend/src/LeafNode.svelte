<script lang="ts">
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Ripple from "@smui/ripple";
  import { results } from "./stores";

  export let name: string;
  export let size: number;
  export let metric: string;
  export let modelA: string;
  export let modelB: string;
  export let selected;
  export let checked;
  export let fullName = name;

  $: resultA = $results.get({
    slice: fullName,
    metric: metric,
    model: modelA,
  } as ResultKey);
  $: resultB = $results.get({
    slice: fullName,
    metric: metric,
    model: modelB,
  } as ResultKey);
</script>

<div
  use:Ripple={{ surface: true, color: "primary" }}
  class="cell parent {selected === fullName ? 'selected' : ''}"
  on:click={() =>
    selected === fullName ? (selected = "") : (selected = fullName)}
>
  <div class="group" style:width="100%">
    <div style:margin-right="5px">
      <FormField on:click={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked.has(fullName)}
          on:click={() => {
            checked.has(fullName)
              ? checked.delete(fullName)
              : checked.add(fullName);
            checked = checked;
          }}
        />
      </FormField>
    </div>
    <div class="group" style:width="100%">
      <span>{name}</span>
      {#if resultA}
        <div>
          <span style:margin-right="10px">
            A: {resultA.toFixed(2)}%
            {#if resultB}
              <span style:margin-left="10px">
                B: {resultB.toFixed(2)}%
              </span>
            {/if}
          </span>
          <span>{size.toLocaleString()}</span>
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
