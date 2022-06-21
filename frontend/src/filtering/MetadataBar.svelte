<script lang="ts">
  import Button from "@smui/button";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import CreateSlice from "./CreateSlice.svelte";
  import MetadataNode from "./MetadataNode.svelte";
  import SliceNode from "./SliceNode.svelte";

  import { getFilterFromPredicates, getMetrics } from "../util";
  import { clickOutside } from "../clickOutside";
  import {
    metadataSelections,
    sliceSelections,
    model,
    settings,
    slices,
    table,
    filteredTable,
    ready,
  } from "../stores";

  let newSlice = false;
  let predicates: FilterPredicate[] = [];

  table.subscribe((t) => updateFilteredTable(t));
  metadataSelections.subscribe(() => updateFilteredTable($table));
  sliceSelections.subscribe(() => updateFilteredTable($table));

  function updateFilteredTable(t: ColumnTable) {
    if (!$ready || $table.size === 0) {
      return;
    }

    let tempTable = t;

    // Filter with slices.
    $sliceSelections.forEach((s) => {
      let filt = getFilterFromPredicates($slices.get(s).predicates);
      tempTable = tempTable.filter(`(d) => ${filt}`);
    });

    // Filter with metadata selections.
    [...$metadataSelections.entries()].forEach((e) => {
      let [name, entry] = e;
      if (entry.type === "range") {
        tempTable = tempTable.filter(
          `(r) => r["${name}"] > ${entry.values[0]} && r["${name}"] < ${entry.values[1]}`
        );
      } else {
        // TODO: figure out BigInt issues.
        if (typeof tempTable.column(name).get(0) === "bigint") {
          entry.values = entry.values.map((d) => BigInt(d));
        }
        tempTable = tempTable.filter(
          aq.escape((r) => aq.op.includes(entry.values, r[name], 0))
        );
      }
    });

    filteredTable.set(tempTable);
    getMetrics([
      {
        name: "",
        predicates: [],
        idxs: tempTable.array($settings.idColumn) as string[],
      },
    ]);
  }
</script>

<div class="side-container">
  <h4>Slices</h4>
  <div style:margin-bottom="10px">
    <Button variant="outlined" on:click={() => (newSlice = true)}>
      New Slice
    </Button>
  </div>
  {#if newSlice}
    <div use:clickOutside on:click_outside={() => (newSlice = false)}>
      <CreateSlice
        metadataSelections={$metadataSelections}
        bind:newSlice
        bind:predicates
      />
    </div>
  {/if}

  {#each [...$slices.values()] as s, i}
    <SliceNode
      name={s.name}
      fullName={s.name}
      selected={$sliceSelections.includes(s.name)}
      setSelected={() => {
        if ($sliceSelections.includes(s.name)) {
          sliceSelections.update((sel) => {
            sel.splice(sel.indexOf(s.name), 1);
            return [...sel];
          });
        } else {
          sliceSelections.update((sel) => [...sel, s.name]);
        }
      }}
    />
  {/each}

  <h4>Metadata</h4>
  {#each $settings.metadata.filter((m) => !m.startsWith("zeno")) as name}
    <MetadataNode {name} col={name} />
  {/each}

  <h4>Distilled Metadata</h4>
  {#each $settings.metadata.filter((m) => m.startsWith("zenopre")) as name}
    <MetadataNode name={name.slice(8)} col={name} />
  {/each}
  {#if $model}
    {#each $settings.metadata.filter( (m) => m.startsWith("zenopost_" + $model + "_") ) as name}
      <MetadataNode name={name.slice(10 + $model.length)} col={name} />
    {/each}
  {/if}

  <div style:height="50px" />
</div>

<style>
  h4 {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
  }
  .side-container {
    height: calc(100vh - 60px);
    overflow-y: auto;
    min-width: 450px;
  }
</style>
