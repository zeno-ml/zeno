<script lang="ts">
  import { Icon } from "@smui/button";
  import Ripple from "@smui/ripple";
  import Textfield from "@smui/textfield";

  import { reports, report, metrics } from "../stores";
  import { clickOutside } from "../clickOutside";
  import Select, { Option } from "@smui/select";
  import HelperText from "@smui/textfield/helper-text";
  import { updateReports } from "../util";

  export let i;

  let rep: Report = $reports[i];
  let name = rep.name;
  $: selected = $report === i;
  let preds: ReportPredicate[] = [];
  report.subscribe((r) => {
    if (r !== -1) {
      preds = $reports[r].reportPredicates;
    }
  });
  reports.subscribe((reps) => {
    if ($report !== -1) {
      preds = reps[$report].reportPredicates;
    }
  });

  let editMode = false;
</script>

<div
  use:clickOutside
  on:click_outside={() => {
    editMode = false;
    reports.update((reps) => {
      reps[i].name = name;
      reps[i].reportPredicates = preds;
      updateReports(reps);
      return reps;
    });
  }}
>
  <div
    use:Ripple={{ surface: true, color: "primary" }}
    class="report {$report === i ? 'selected' : ''}"
    on:click={() => report.set(i)}
  >
    {#if !editMode}
      <p>{rep.name}</p>
    {:else}
      <Textfield bind:value={name} />
    {/if}

    <div style:cursor="pointer">
      <Icon
        class="material-icons"
        on:click={(e) => {
          e.stopPropagation();
          editMode = !editMode;
        }}
      >
        edit
      </Icon>
      <Icon
        class="material-icons"
        on:click={(e) => {
          e.stopPropagation();
          reports.update((reps) => {
            reps.splice(i, 1);
            updateReports(reps);
            return reps;
          });
        }}
      >
        delete
      </Icon>
    </div>
  </div>
  {#if selected}
    <div class="report-predicates">
      {#each preds as pred}
        <div class="report-predicate">
          <p>{pred.sliceName}</p>
          {#if editMode}
            <Select
              bind:value={pred.metric}
              label="Operation"
              style="margin-right: 20px; margin-left: 20px; width: 120px"
            >
              {#each $metrics as m}
                <Option value={m}>{m}</Option>
              {/each}
            </Select>
            <Select
              bind:value={pred.operation}
              label="Operation"
              style="margin-right: 20px; width: 120px"
            >
              {#each [">", "<", "==", "!="] as o}
                <Option value={o}>{o}</Option>
              {/each}
            </Select>
            <Textfield
              style="width: 50px"
              bind:value={pred.value}
              label="Value"
            >
              <HelperText slot="helper">0</HelperText>
            </Textfield>
          {:else if pred.metric && pred.operation}
            <p class="details">{pred.metric} {pred.operation} {pred.value}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .details {
    margin-left: 15px;
    color: grey;
  }
  .report {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 0.5px solid rgb(224, 224, 224);
    border-top: 0.5px solid rgb(224, 224, 224);
    padding-left: 10px;
    padding-right: 10px;
  }
  .report-predicates {
    margin-left: 20px;
  }
  .report-predicate {
    display: flex;
  }
  .selected {
    background: #ebdffc;
  }
</style>
