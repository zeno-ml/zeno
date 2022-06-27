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
  import { updateReports, updateTab } from "./util";

  export let sli: Slice;

  let expanded = false;
  let hasSlice = false;

  let predicateResults: boolean[] = new Array($models.length).fill(true);

  reports.subscribe((reps) => {
    reportHasSlice($report, reps);
    updatePredicateResults(reps[$report]);
  });
  report.subscribe((rep) => {
    reportHasSlice(rep, $reports);
    updatePredicateResults($reports[rep]);
  });

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

  function updatePredicateResults(rep: Report) {
    if (!rep) {
      predicateResults = new Array($models.length).fill(true);
      return;
    }
    let relevantPredicates = rep.reportPredicates.filter(
      (r) => r.metric === $metric && r.sliceName === sli.sliceName
    );
    $models.forEach((m, i) => {
      let result = $results.get({
        slice: sli.sliceName,
        metric: $metric,
        model: m,
      });
      relevantPredicates.forEach((p) => {
        if (!eval(`${result} ${p.operation} ${p.value}`)) {
          predicateResults[i] = false;
        }
      });
    });
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
                    metric: "",
                    operation: "",
                    value: "0",
                  });
                } else {
                  rep.reportPredicates.splice(idx, 1);
                }
                reps[$report] = rep;
                updateReports(reps);
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
  {#each $models as m, i}
    {@const r = $results.get({
      slice: sli.sliceName,
      metric: $metric,
      model: m,
    })}
    <Cell class={expanded ? "detail-row" : ""}>
      <p style:color={predicateResults[i] ? "black" : "red"}>
        {r ? r.toFixed(2) : ""}
      </p>
    </Cell>
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
