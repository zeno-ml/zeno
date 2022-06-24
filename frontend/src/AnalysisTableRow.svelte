<script lang="ts">
  import { metric, models, results } from "./stores";
  import { Row, Cell } from "@smui/data-table";
  import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import { Icon } from "@smui/common";

  import SliceDetails from "./SliceDetails.svelte";

  export let sli: Slice;

  let expanded = false;
</script>

<Row>
  <Cell class={expanded ? "detail-row" : ""}>
    <div class="inline">
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
      <div>
        {sli.name}
      </div>
    </div>
  </Cell>
  {#each $models as m}
    {@const r = $results.get({
      slice: sli.name,
      metric: $metric,
      model: m,
    })}
    <Cell class={expanded ? "detail-row" : ""}>{r ? r.toFixed(2) : ""}</Cell>
  {/each}
</Row>
{#if expanded}
  <Row>
    <Cell colspan={$models.length + 1}>
      <SliceDetails {sli} />
    </Cell>
  </Row>
{/if}

<style>
  .inline {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  :global(.detail-row) {
    border: none;
  }
</style>
