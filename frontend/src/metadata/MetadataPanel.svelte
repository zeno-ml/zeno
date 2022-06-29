<script lang="ts">
  import Button from "@smui/button";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import CreateSlice from "../filtering/CreateSlice.svelte";
  import MetadataNode from "./MetadataCell.svelte";
  import SliceNode from "./SliceCell.svelte";

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

  let name = "";
  let newSlice = false;
  let mode = "create";
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
      let filt = getFilterFromPredicates($slices.get(s).filterPredicates);
      tempTable = tempTable.filter(`(d) => ${filt}`);
    });

    // Filter with metadata selections.
    [...$metadataSelections.entries()].forEach((e) => {
      let [name, entry] = e;
      if (entry.type === "range") {
        tempTable = tempTable.filter(
          `(r) => r["${name}"] > ${entry.values[0]} && r["${name}"] < ${entry.values[1]}`
        );
      } else if (entry.type === "binary") {
        if (entry.values[0] === "is") {
          tempTable = tempTable.filter(`(r) => r["${name}"] == 1`);
        } else {
          tempTable = tempTable.filter(`(r) => r["${name}"] == 0`);
        }
      } else {
        tempTable = tempTable.filter(
          aq.escape((r) => aq.op.includes(entry.values, r[name], 0))
        );
      }
    });

    filteredTable.set(tempTable);
    getMetrics([
      <Slice>{
        sliceName: "",
        filterPredicates: [],
        idxs: tempTable.array($settings.idColumn) as string[],
      },
    ]);
  }

  function editSlice(sli: Slice) {
    predicates = sli.filterPredicates;
    name = sli.sliceName;
    mode = "edit";
    newSlice = true;
  }
</script>

<div class="side-container">
  <div class="inline">
    <h4>Slices</h4>
    <div style:margin-right="13px">
      <Button
        variant="outlined"
        on:click={() => {
          predicates = [];
          name = "";
          newSlice = true;
        }}
      >
        New Slice
      </Button>
    </div>
  </div>
  {#if newSlice}
    <div
      use:clickOutside
      on:click_outside={() => {
        mode = "create";
        newSlice = false;
      }}
    >
      <CreateSlice
        metadataSelections={$metadataSelections}
        bind:newSlice
        bind:predicates
        bind:mode
        bind:name
      />
    </div>
  {/if}

  {#each [...$slices.values()] as s, i}
    <SliceNode
      name={s.sliceName}
      fullName={s.sliceName}
      {editSlice}
      selected={$sliceSelections.includes(s.sliceName)}
      setSelected={() => {
        if ($sliceSelections.includes(s.sliceName)) {
          sliceSelections.update((sel) => {
            sel.splice(sel.indexOf(s.sliceName), 1);
            return [...sel];
          });
        } else {
          sliceSelections.update((sel) => [...sel, s.sliceName]);
        }
      }}
    />
  {/each}

  <h4>Metadata</h4>
  {#each $settings.metadataColumns.filter((m) => !m.startsWith("zeno")) as name}
    <MetadataNode {name} col={name} />
  {/each}

  <h4>Distilled Metadata</h4>
  {#each $settings.metadataColumns.filter( (m) => m.startsWith("zenopre") ) as name}
    <MetadataNode name={name.slice(8)} col={name} />
  {/each}
  {#if $model}
    {#each $settings.metadataColumns.filter( (m) => m.startsWith("zenopost_" + $model + "_") ) as name}
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
    padding: 10px;
  }
  .inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
