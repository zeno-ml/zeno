<script lang="ts">
  import Button from "@smui/button";
  import Paper, { Content } from "@smui/paper";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";

  import autoAnimate from "@formkit/auto-animate";

  import { filteredTable, settings, slices, table } from "../stores";
  import { getFilterFromPredicates, getMetrics } from "../util";

  import FilterEntry from "./FilterEntry.svelte";
  import { onMount } from "svelte";

  export let name;
  export let newSlice;
  export let mode = "create";
  export let predicates: FilterPredicate[];
  export let metadataSelections: Map<string, MetadataSelection>;

  let nameField;

  // Pre-fill slice creation with current metadata selections.
  if (metadataSelections.size !== 0) {
    predicates = [];
    [...metadataSelections.values()].forEach((entry) => {
      // TODO: support slice selections
      if (entry.type === "range") {
        predicates.push({
          name: entry.name,
          predicateType: "metadata",
          operation: ">=",
          value: entry.values[0],
          join: "AND",
        });
        predicates.push({
          name: entry.name,
          predicateType: "metadata",
          operation: "<=",
          value: entry.values[1],
          join: "AND",
        });
      } else if (entry.type === "binary") {
        let val = entry.values[0] === "is" ? "1" : "0";
        predicates.push({
          name: entry.name,
          predicateType: "metadata",
          operation: "==",
          value: val,
          join: "AND",
        });
      } else {
        entry.values.forEach((v, j) => {
          let indicator = undefined;
          if (entry.values.length > 1 && j === 0) {
            indicator = "start";
          } else if (entry.values.length > 1 && j === entry.values.length - 1) {
            indicator = "end";
          }
          predicates.push({
            name: entry.name,
            predicateType: "metadata",
            operation: "==",
            value: v,
            join: "OR",
            groupIndicator: indicator,
          });
        });
      }
    });
  } else if (predicates.length === 0) {
    predicates.push({
      name: "",
      predicateType: "metadata",
      operation: "",
      value: "",
      join: "",
    });
  }

  function deletePredicate(i) {
    predicates.splice(i, 1);
    predicates = predicates;
  }

  function createSlice() {
    if (name.length === 0) {
      name = "Slice " + $slices.size;
    }
    newSlice = false;

    const filt = getFilterFromPredicates(predicates);

    let tempTable = $table.filter(`(d) => ${filt}`);
    filteredTable.set(tempTable);

    getMetrics([
      <Slice>{
        sliceName: name,
        filterPredicates: predicates,
        idxs: tempTable.array($settings.idColumn) as string[],
      },
    ]);

    slices.update((s) => {
      s.set(name, <Slice>{
        sliceName: name,
        filterPredicates: predicates,
      });
      return s;
    });
  }

  onMount(() => nameField.getElement().focus());

  function submit(e) {
    if (e.key === "Enter") {
      createSlice();
    }
  }
</script>

<svelte:window on:keydown={submit} />
<div id="paper-container">
  <Paper elevation={7}>
    <Content>
      <Textfield bind:value={name} label="Name" bind:this={nameField}>
        <HelperText slot="helper">Slice 1</HelperText>
      </Textfield>
      <ul use:autoAnimate>
        {#each predicates as p, i}
          <li>
            <FilterEntry
              first={i === 0 ? true : false}
              deletePredicate={() => deletePredicate(i)}
              bind:predicate={p}
            />
          </li>
        {/each}
      </ul>
      <div
        class="add"
        on:click={() => {
          predicates.push({
            name: "",
            predicateType: "metadata",
            operation: "",
            value: "",
            join: "AND",
          });
          predicates = predicates;
        }}
      >
        add filter
      </div>
      <div id="submit">
        <Button
          variant="outlined"
          on:click={createSlice}
          disabled={$slices.has(name) && mode === "create"}
        >
          {mode === "edit" ? "Edit Slice" : "Create Slice"}
        </Button>
        {#if $slices.has(name) && mode === "create"}
          <p style:margin-right="10px" style:color="red">
            slice already exists
          </p>
        {/if}
      </div>
    </Content>
  </Paper>
</div>

<style>
  #paper-container {
    position: absolute;
    z-index: 1;
    margin-top: 10px;
    min-width: 900px;
  }
  #submit {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
  }
  .add {
    padding: 5px;
    width: max-content;
    margin-top: 10px;
    cursor: pointer;
    color: #6200ee;
  }
  .add:hover {
    background: #ede1fd;
    border-radius: 5px;
  }
  ul {
    list-style-type: none;
  }
</style>
