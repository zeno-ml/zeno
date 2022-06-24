<script lang="ts">
  import { models, slices } from "./stores";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";

  import Settings from "./Settings.svelte";
  import AnalysisTableRow from "./AnalysisTableRow.svelte";
  import ReportsPanel from "./ReportsPanel.svelte";
</script>

<div class="inline">
  <div>
    <ReportsPanel />
  </div>
  <div>
    <div class="settings">
      <Settings />
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
