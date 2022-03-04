<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import Tooltip, { Wrapper } from "@smui/tooltip";

  export let id_col: string;
  export let table: ColumnTable;

  console.log("hi");

  // slices.subscribe((s) => {
  //   if (s.size === 0) {
  //     return;
  //   }
  //   slice = s.get(sli);
  //   console.log(s, slice);
  //   if (!slice.table) {
  //     fetch("/api/table/" + slice.name)
  //       .then((d) => d.arrayBuffer())
  //       .then((d) => {
  //         slice.table = fromArrow(d);
  //         s.set(sli, slice);
  //         slices.set(s);
  //       })
  //       .catch((e) => console.log(e));
  //   }
  // });

  let n = 20;
</script>

<button on:click={() => (n += 10)}>See more</button>
<div class="container">
  {#each table.slice(0, n).objects() as row}
    <Wrapper>
      <img
        src="/static/{row[id_col]}"
        alt="Image thumbnail for instance {row[id_col]}"
      />
      <Tooltip>
        {#each Object.keys(row) as key}
          {key} : {row[key]}
          <br />
        {/each}
      </Tooltip>
    </Wrapper>
  {/each}

  <!-- {#if type == "table"}
    <SamplesTable {table} />
  {:else if type == "image"}
    <SamplesImages {table} />
  {/if} -->
</div>
