<script lang="ts">
  import Paper from "@smui/paper";
  import { onMount } from "svelte";

  // onMount(() => {
  //   fetch("/api/slicers")
  //     .then((d) => d.json())
  //     .then((d) => slicers.set(JSON.parse(d)));
  // });
</script>

<div class="container">
  <Paper style="width:fit-content">Hi</Paper>
  <Paper style="width:fit-content">Hi</Paper>
  <Paper style="width:fit-content">Hi</Paper>
  <Paper style="width:fit-content">Hi</Paper>
</div>

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }
</style>
