<script lang="ts">
  import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
  import Chip, { Text, Set as ChipSet } from "@smui/chips";
  import { fromArrow } from "arquero";

  import Samples from "./samples/Samples.svelte";

  import { slices } from "./stores";

  export let params: { slicer: string } = { slicer: "" };

  let currSlice: Slice;
  let selected: string[] = [];

  $: if (currSlice) {
    if (!currSlice.table) {
      fetch("/api/table/" + currSlice.name.join(""))
        .then((d) => d.arrayBuffer())
        .then((d) => {
          currSlice.table = fromArrow(d);
          $slices.set(currSlice.name.join(""), currSlice);
          slices.set($slices);
        })
        .catch((e) => console.log(e));
    }
  }

  let open = -1;

  let shownSlices: Slice[] = [];
  slices.subscribe((sls) => updateShownSlices(sls));

  function updateShownSlices(sls: Map<string, Slice>) {
    if (sls.size === 0) {
      shownSlices = [];
      return;
    }
    if (params.slicer) {
      console.log(params.slicer);
      shownSlices = [sls.get(params.slicer)];
      return;
    }
    if (selected.length === 0) {
      shownSlices = [...sls.values()];
      return;
    }
    let slicesToInclude = new Set(sls.values());
    selected.forEach((sel) => {
      [...sls.values()].forEach((slice) => {
        if (!slice.name.includes(sel)) {
          slicesToInclude.delete(slice);
        }
      });
    });
    shownSlices = [...slicesToInclude.values()];
  }
  $: {
    selected;
    updateShownSlices($slices);
  }
</script>

<h2>Slices</h2>

<div class="accordion-container">
  <Accordion style="width:100%">
    {#each shownSlices as sli, i}
      <Panel
        on:SMUIAccordionHeader:activate={() => {
          currSlice = sli;
          open = i;
        }}
      >
        <Header>
          <ChipSet chips={sli.name} filter let:chip bind:selected>
            <Chip {chip} on:click={(e) => e.stopPropagation()}>
              <Text>
                {chip}
              </Text>
            </Chip>
          </ChipSet>
          <span slot="description">
            {sli.size} instances
          </span>
        </Header>
        <Content>
          {#if open === i && sli.table}
            <Samples
              id_col={sli.id_column}
              label_col={sli.label_column}
              table={sli.table}
            />
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
