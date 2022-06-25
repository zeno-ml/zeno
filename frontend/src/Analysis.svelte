<script lang="ts">
  import { metric, metrics, models, slices } from "./stores";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";

  import AnalysisTableRow from "./AnalysisTableRow.svelte";
  import ReportsPanel from "./report/ReportsPanel.svelte";
  import Select, { Option } from "@smui/select";
</script>

<div class="inline">
  <div>
    <ReportsPanel />
  </div>
  <div>
    <div class="settings">
      {#if $metrics}
        <Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
          {#each $metrics as m}
            <Option value={m}>{m}</Option>
          {/each}
        </Select>
      {/if}
    </div>
    <div class="table">
      <DataTable table$aria-label="People list" style="max-width: 100%;">
        <Head>
          <Row>
            <Cell>{""}</Cell>
            {#each $models as m}
              <Cell>{m}</Cell>
            {/each}
          </Row>
        </Head>
        <Body>
          {#each [...$slices.values()] as sli}
            <AnalysisTableRow {sli} />
          {/each}
        </Body>
      </DataTable>
    </div>
  </div>
</div>

<style>
  .inline {
    display: flex;
    flex-direction: row;
  }
  .table {
    margin-top: 20px;
  }
  .settings {
    margin-top: 10px;
  }
</style>
