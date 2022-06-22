<script lang="ts">
  import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import { Icon } from "@smui/common";
  import { slide } from "svelte/transition";
  import Ripple from "@smui/ripple";

  import { results, model, metric, slices } from "../stores";

  export let name: string;
  export let fullName = name;
  export let selected = false;
  export let setSelected;
  export let editSlice;

  let expanded = false;

  $: sli = $slices.get(fullName);
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
      <div class="group" style:width="max-content">
        <div
          style:width="24px"
          style:height="24px"
          style:cursor="pointer"
          style:margin-right="10px"
        >
          <Icon
            component={Svg}
            viewBox="0 0 24 24"
            class="material-icons"
            on:click={(e) => {
              e.stopPropagation();
              expanded = !expanded;
            }}
          >
            <path
              fill="currentColor"
              d={expanded ? mdiChevronUp : mdiChevronDown}
            />
          </Icon>
        </div>
        <div>{name}</div>
      </div>
      <div class="group">
        {#if result}
          <span style:margin-right="10px">
            {result.toFixed(2)}
          </span>
        {/if}
        <div style:cursor="pointer">
          <Icon
            class="material-icons"
            on:click={(e) => {
              e.stopPropagation();
              editSlice(sli);
            }}
          >
            edit
          </Icon>
          <Icon
            class="material-icons"
            on:click={(e) => {
              e.stopPropagation();
              slices.update((s) => {
                s.delete(name);
                return s;
              });
              fetch("/api/delete-slice/" + encodeURIComponent(name));
            }}
          >
            delete
          </Icon>
        </div>
      </div>
    </div>
  </div>
  {#if expanded}
    <div in:slide out:slide class="details">
      {#each sli.predicates as pred, i}
        <div class="meta-chip">
          <span>
            {pred.groupIndicator === "start" ? "(" : ""}
            {i === 0 ? "" : pred.join}
            {pred.name}
            {pred.operation}
            {!isNaN(Number(pred.value))
              ? Number(pred.value).toFixed(2)
              : pred.value}
            {pred.groupIndicator === "end" ? ")" : ""}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .details {
    padding-top: 10px;
    margin-left: 10px;
    margin-top: 10px;
    border-top: 1px solid #ccc;
  }
  .cell {
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: 400px;
    width: fit-content;
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
