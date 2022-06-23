<script lang="ts">
  import { metric, models, results, slices } from "./stores";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";

  import Settings from "./Settings.svelte";
  import SliceDetails from "./SliceDetails.svelte";
</script>

<Settings />
<div>
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
        <Row>
          <Cell>{sli.name} <SliceDetails {sli} /></Cell>
          {#each $models as m}
            {@const r = $results.get({
              slice: sli.name,
              metric: $metric,
              model: m,
            })}
            <Cell>{r ? r.toFixed(2) : ""}</Cell>
          {/each}
        </Row>
      {/each}
    </Body>
  </DataTable>
</div>
