<script lang="ts">
  import Button from "@smui/button";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import { clickOutside } from "./clickOutside";
  import CreateSlice from "./CreateSlice.svelte";
  import MetadataNode from "./MetadataNode.svelte";
  import SampleOptions from "./SampleOptions.svelte";
  import Samples from "./Samples.svelte";
  import Slice from "./Slice.svelte";

  import {
    currentColumns,
    filteredTable,
    formattedCurrentColumns,
    metadataSelections,
    metric,
    metrics,
    model,
    models,
    ready,
    settings,
    slices,
    table,
  } from "./stores";
  import { filterWithPredicates, updateResults } from "./util";

  let newSlice = false;
  let selected: string[] = [];
  let predicates: FilterPredicate[] = [];

  ready.subscribe((r) => {
    if (r) {
      model.set($models[0]);
      metric.set($metrics[0]);
    }
  });

  table.subscribe((t) => updateFilteredTable(t));
  metadataSelections.subscribe(() => updateFilteredTable($table));
  $: {
    selected;
    updateFilteredTable($table);
  }

  function updateFilteredTable(t: ColumnTable) {
    if (!$ready || $table.size === 0) {
      return;
    }

    let tempTable = t;

    // Filter with slices.
    selected.forEach((s) => {
      let filt = filterWithPredicates(
        $slices.get(s).predicates,
        tempTable,
        $currentColumns,
        $formattedCurrentColumns,
        $slices
      );
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
        if (typeof tempTable.column(name).get(0) === "bigint") {
          entry.values = entry.values.map((d) => BigInt(d));
        }
        tempTable = tempTable.filter(
          aq.escape((r) => aq.op.includes(entry.values, r[name], 0))
        );
      }
    });

    filteredTable.set(tempTable);
    updateResults([
      {
        sli: "selection",
        idxs: tempTable.array($settings.idColumn) as string[],
      },
    ]);
  }
</script>

<div id="container">
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
      <Slice
        name={s.name}
        fullName={s.name}
        size={s.size}
        selected={selected.includes(s.name)}
        setSelected={() => {
          if (selected.includes(s.name)) {
            selected.splice(selected.indexOf(s.name), 1);
          } else {
            selected.push(s.name);
          }
          selected = selected;
        }}
      />
    {/each}

    <h4>Metadata</h4>
    {#each $settings.metadata.filter((m) => !m.startsWith("zeno")) as name}
      <MetadataNode {name} col={name} />
    {/each}

    <h4>Preprocessors</h4>
    {#each $settings.metadata.filter((m) => m.startsWith("zenopre")) as name}
      <MetadataNode name={name.slice(8)} col={name} />
    {/each}

    <h4>Postprocessors</h4>
    {#if $model}
      {#each $settings.metadata.filter( (m) => m.startsWith("zenopost_" + $model + "_") ) as name}
        <MetadataNode name={name.slice(10 + $model.length)} col={name} />
      {/each}
    {/if}

    {#if $model}
      <h4>Outputs</h4>
      <MetadataNode name={$model} col={"zenomodel_" + $model} />
    {/if}
  </div>

  {#if $filteredTable}
    <div style:margin-left="10px">
      <div id="sample-options">
        <SampleOptions bind:selected />
      </div>
      <div id="samples">
        <Samples />
      </div>
    </div>
  {/if}
</div>

<style>
  #samples {
    margin-top: 10px;
    width: 100%;
    margin-right: 20px;
  }
  #sample-options {
    margin-top: 10px;
    width: 100%;
    min-height: 35px;
    margin-right: 20px;
  }
  #container {
    display: flex;
    flex-direction: row;
  }
  .side-container {
    height: calc(100vh - 60px);
    overflow-y: auto;
    min-width: 450px;
  }
  h4 {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
  }
</style>
