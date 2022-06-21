<script lang="ts">
  import Button from "@smui/button";
  import Paper, { Content } from "@smui/paper";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";

  import { filteredTable, settings, slices, table } from "../stores";
  import { getFilterFromPredicates, getMetrics } from "../util";

  import FilterEntry from "./FilterEntry.svelte";

  export let newSlice;
  export let predicates: FilterPredicate[];
  export let metadataSelections: Map<string, MetadataSelection>;

  let name = "";

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
      {
        name: name,
        predicates: predicates,
        idxs: tempTable.array($settings.idColumn) as string[],
      },
    ]);

    slices.update((s) => {
      s.set(name, {
        name: name,
        predicates: predicates,
      });
      return s;
    });
  }
</script>

<div id="paper-container">
  <Paper elevation={7}>
    <Content>
      <Textfield bind:value={name} label="Name">
        <HelperText slot="helper">Slice 1</HelperText>
      </Textfield>
      {#each predicates as p, i}
        <FilterEntry
          first={i === 0 ? true : false}
          deletePredicate={() => deletePredicate(i)}
          bind:predicate={p}
        />
      {/each}
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
        <Button variant="outlined" on:click={createSlice}>Create Slice</Button>
      </div>
    </Content>
  </Paper>
</div>

<style>
  #paper-container {
    position: absolute;
    z-index: 1;
    margin-top: 10px;
  }
  #submit {
    display: flex;
    flex-direction: row-reverse;
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
</style>
