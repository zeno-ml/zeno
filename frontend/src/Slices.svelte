<script lang="ts">
  import { onMount } from "svelte";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";

  import { slices } from "./stores";
  import Samples from "./samples/Samples.svelte";

  export let params = {};

  let open = -1;
  $: console.log(open);
  onMount(() => {
    if ($slices.length === 0) {
      fetch("/api/slices")
        .then((d) => d.json())
        .then((d) => {
          let out = JSON.parse(d) as Slice[];
          out.sort((a, b) => b.size - a.size);
          slices.set(out);
        });
    }
  });
</script>

<h2>Slices</h2>
<h5>Testing functions</h5>

<div class="accordion-container">
  <Accordion style="width:100%">
    {#each params.slicer ? $slices.filter((d) => d.name === params.slicer) : $slices as sli, i}
      <Panel on:SMUIAccordionHeader:activate={() => (open = i)}>
        <Header>
          {sli.name}
          <span slot="description">
            {sli.size} instances
          </span>
        </Header>
        <Content>
          {#if open === i}
            <Samples {sli} />
          {/if}
        </Content>
      </Panel>
    {/each}
  </Accordion>
</div>

<style>
  .accordion-container {
    min-width: 500px;
    width: 100%;
  }
</style>
