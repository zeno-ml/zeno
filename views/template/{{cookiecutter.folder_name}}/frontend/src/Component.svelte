<script lang="ts">
  // List of objects with keys corresponding to the following props.
  export let table;
  // Key for model outputs.
  export let modelColumn;
  // Key for groundtruth labels.
  export let labelColumn;
  // Key for the input data.
  export let dataColumn;
  // Key for the transformed data (current transform).
  export let transformColumn;
  // Key for unique identifier of each item.
  export let idColumn;
</script>

<div id="container" />

<style>
  #container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
