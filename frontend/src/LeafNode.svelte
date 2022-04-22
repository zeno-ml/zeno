<script lang="ts">
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Ripple from "@smui/ripple";

  export let name: string;
  export let size: number;
  export let result;
  export let modelA: string;
  export let modelB: string;
  export let selected;
  export let checked;
  export let fullName = name;
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
      {#if result}
        <div>
          <span style:margin-right="10px">
            A: {result.modelResults[modelA]
              ? result.modelResults[modelA].toFixed(2)
              : ""}%
            {#if modelB && result.modelResults[modelB]}
              <span style:margin-left="10px">
                B: {result.modelResults[modelB].toFixed(2)}%
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
