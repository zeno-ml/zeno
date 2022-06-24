<script lang="ts">
  import Button, { Icon } from "@smui/button";
  import Ripple from "@smui/ripple";

  import { reports, report } from "../stores";
</script>

<div id="reports-container">
  <p>overall</p>
  <hr />
  <h4>Reports</h4>
  <div id="reports">
    {#each $reports as rep, i}
      <div
        use:Ripple={{ surface: true, color: "primary" }}
        class="report {$report === i ? 'selected' : ''}"
        on:click={() => {
          report.set(i);
        }}
      >
        <p>{rep.name}</p>
        <div style:cursor="pointer">
          <Icon
            class="material-icons"
            on:click={(e) => {
              e.stopPropagation();
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
                return reps;
              });
            }}
          >
            delete
          </Icon>
        </div>
      </div>
    {/each}
  </div>
  <Button
    variant="outlined"
    on:click={() => {
      reports.update((reps) => {
        reps.push({
          name: "new report",
          slices: [],
        });
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
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 0.5px solid rgb(224, 224, 224);
    border-top: 0.5px solid rgb(224, 224, 224);
  }
  .selected {
    background: #ebdffc;
  }
</style>
