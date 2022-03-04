<script lang="ts">
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import { fromArrow } from "arquero";

  import Samples from "./samples/Samples.svelte";

  import { slices } from "./stores";

  export let params: { slicer: string } = { slicer: "" };

  let currSlice: Slice;

  $: if (currSlice) {
    if (!currSlice.table) {
      fetch("/api/table/" + currSlice.name)
        .then((d) => d.arrayBuffer())
        .then((d) => {
          currSlice.table = fromArrow(d);
          $slices.set(currSlice.name, currSlice);
          slices.set($slices);
        })
        .catch((e) => console.log(e));
    }
  }

  let open = -1;
</script>

<h2>Slices</h2>
<h5>Testing functions</h5>

<div class="accordion-container">
  <Accordion style="width:100%">
    {#if $slices.size > 0}
      {#each params.slicer ? [$slices[params.slicer]] : [...$slices.values()] as sli, i}
        <Panel
          on:SMUIAccordionHeader:activate={() => {
            currSlice = sli;
            open = i;
          }}
        >
          <Header>
            {sli.name}
            <span slot="description">
              {sli.size} instances
            </span>
          </Header>
          <Content>
            {#if open === i && sli.table}
              <Samples id_col={sli.id_column} table={sli.table} />
            {/if}
          </Content>
        </Panel>
      {/each}
    {/if}
  </Accordion>
</div>

<style>
  .accordion-container {
    min-width: 500px;
    width: 100%;
  }
</style>
