<script lang="ts">
  import Button, { Icon } from "@smui/button";
  import { Svg } from "@smui/common/elements";
  import Ripple from "@smui/ripple";
  import { mdiTableMultiple } from "@mdi/js";

  import { reports, report } from "../stores";
  import ReportRow from "./ReportRow.svelte";
  import { updateReports } from "../util";

  report.set(-1);
</script>

<div id="reports-container">
  <div
    use:Ripple={{ surface: true, color: "primary" }}
    class={"overview " + ($report === -1 ? "selected" : "")}
    on:click={() => {
      report.set(-1);
    }}
  >
    <div class="icon">
      <Icon component={Svg} viewBox="0 0 24 24">
        <path fill="currentColor" d={mdiTableMultiple} />
      </Icon>
    </div>
    <p>all slices</p>
  </div>
  <h4>Reports</h4>
  <div id="reports">
    {#each $reports as rep, i}
      <ReportRow {i} />
    {/each}
  </div>
  <Button
    variant="outlined"
    on:click={() => {
      reports.update((reps) => {
        reps.push({
          name: "new report",
          reportPredicates: [],
        });
        updateReports(reps);
        return reps;
      });
    }}>New Report</Button
  >
</div>

<style>
  #reports-container {
    padding: 10px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    min-width: 450px;
  }
  #reports {
    margin-bottom: 10px;
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
  .overview {
    display: flex;
    align-items: center;
    border-bottom: 0.5px solid rgb(224, 224, 224);
    border-top: 0.5px solid rgb(224, 224, 224);
    padding-left: 10px;
    padding-right: 10px;
  }
  .selected {
    background: #ebdffc;
  }
  .icon {
    width: 24px;
    height: 24px;
    margin-right: 10px;
  }
</style>
