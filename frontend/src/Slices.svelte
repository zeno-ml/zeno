<script lang="ts">
  import { onMount } from "svelte";
  import Highlight from "svelte-highlight";
  import python from "svelte-highlight/src/languages/python";
  import LayoutGrid, { Cell } from "@smui/layout-grid";
  import Paper from "@smui/paper";
  import Card, { PrimaryAction } from "@smui/card";

  import { slicers } from "./stores";

  onMount(() => {
    if ($slicers.length === 0) {
      fetch("/api/slicers")
        .then((d) => d.json())
        .then((d) => {
          let out = JSON.parse(d);
          out.sort((a, b) => b.size - a.size);
          slicers.set(out);
        });
    }
  });
</script>

<h2>Slices</h2>
<h5>Testing functions</h5>
<LayoutGrid>
  {#each $slicers as sli}
    <Cell>
      <Paper>
        <p>{sli.name}</p>
        <p>{sli.size} instances</p>
        <!-- <Highlight
          language={python}
          code={sli.fn.substring(sli.fn.indexOf("\n"))}
        /> -->
        <div style="display: flex; flex-direction: row">
          {#each sli.tests as test}
            <Card variant="outlined" style="width: fit-content">
              <PrimaryAction padded>
                {test}
              </PrimaryAction>
            </Card>
          {/each}
        </div>
      </Paper>
    </Cell>
  {/each}
</LayoutGrid>
