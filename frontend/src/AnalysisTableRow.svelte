<script lang="ts">
  import {
    mdiChevronDown,
    mdiChevronUp,
    mdiMinusCircleOutline,
    mdiPlusCircleOutline,
  } from "@mdi/js";
  import { Icon } from "@smui/common";
  import { Svg } from "@smui/common/elements";
  import { Cell, Row } from "@smui/data-table";

  import SliceDetails from "./SliceDetails.svelte";

  import {
    metadataSelections,
    metric,
    models,
    report,
    reports,
    results,
    sliceSelections,
  } from "./stores";
  import { updateTab } from "./util";

  export let sli: Slice;

  let expanded = false;
  let hasSlice = false;

  reports.subscribe((reps) => reportHasSlice($report, reps));
  report.subscribe((rep) => reportHasSlice(rep, $reports));

  function reportHasSlice(report, reports) {
    if (report === -1) {
      return false;
    }
    let rep = reports[report];
    let idx = rep.reportPredicates.findIndex(
      (pred) => pred.sliceName === sli.sliceName
    );
    hasSlice = idx === -1 ? false : true;
  }
</script>

<Row>
  <Cell class={expanded ? "detail-row" : ""}>
    <div class="inline">
      {#if $report !== -1}
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
              reports.update((reps) => {
                let rep = reps[$report];
                let idx = rep.reportPredicates.findIndex(
                  (pred) => pred.sliceName === sli.sliceName
                );
                if (idx === -1) {
                  rep.reportPredicates.push({
                    sliceName: sli.sliceName,
                    operation: undefined,
                    value: undefined,
                  });
                } else {
                  rep.reportPredicates.splice(idx, 1);
                }
                reps[$report] = rep;
                return reps;
              });
            }}
          >
            <path
              fill="#9b51e0"
              d={hasSlice ? mdiMinusCircleOutline : mdiPlusCircleOutline}
            />
          </Icon>
        </div>
      {/if}
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
      <div
        class="slice-link"
        on:click={() => {
          updateTab("exploration");
          metadataSelections.set(new Map());
          sliceSelections.set([sli.sliceName]);
        }}
      >
        {sli.sliceName}
      </div>
    </div>
  </Cell>
  {#each $models as m}
    {@const r = $results.get({
      slice: sli.sliceName,
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

  .slice-link {
    color: #9b51e0;
    cursor: pointer;
  }
</style>
