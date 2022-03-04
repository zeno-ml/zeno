<script lang="ts">
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";

  import Samples from "./samples/Samples.svelte";

  import { slices } from "./stores";

  export let params: { slicer: string } = { slicer: "" };

  let open = -1;
</script>

<h2>Slices</h2>
<h5>Testing functions</h5>

<div class="accordion-container">
  <Accordion style="width:100%">
    {#if $slices.size > 0}
      {#each params.slicer ? [$slices[params.slicer]] : [...$slices.values()] as sli, i}
        <Panel on:SMUIAccordionHeader:activate={() => (open = i)}>
          <Header>
            {sli.name}
            <span slot="description">
              {sli.size} instances
            </span>
          </Header>
          <Content>
            {#if open === i}
              <Samples sli={sli.name} />
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
