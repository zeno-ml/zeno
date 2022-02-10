<script lang="ts">
  import { onMount } from "svelte";
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";

  import ImageList from "./ImageList.svelte";

  import { slices } from "./stores";

  export let params = {};

  onMount(() => {
    if ($slices.length === 0) {
      fetch("/api/slices")
        .then((d) => d.json())
        .then((d) => {
          let out = JSON.parse(d);
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
    {#each params.slicer ? $slices.filter((d) => d.slicer === params.slicer) : $slices as sli}
      <Panel>
        <Header>
          {sli.name}
          <span slot="description">
            {sli.size} instances
          </span>
        </Header>
        <Content>
          <ImageList />
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
