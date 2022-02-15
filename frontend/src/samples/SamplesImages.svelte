<script lang="ts">
  import Paper from "@smui/paper";

  export let entries;
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
