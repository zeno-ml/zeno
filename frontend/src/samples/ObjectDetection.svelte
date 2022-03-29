<script lang="ts">
  import Paper from "@smui/paper";

  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { settings } from "../stores";

  export let table;
  export let modelACol;
  export let modelBCol;
</script>

{#each table as row}
  <div class="box">
    <Paper square>
      <Wrapper>
        <img
          src="/static/{row[$settings.idColumn]}"
          style:max-width="100px"
          style:max-height="100px"
          alt="Image thumbnail for instance {row[$settings.idColumn]}"
        />
        <Tooltip>
          {#each Object.keys(row) as key}
            {key} : {row[key]}
            <br />
          {/each}
        </Tooltip>
      </Wrapper>
    </Paper>
  </div>
{/each}

<style>
  .box {
    padding: 10px;
  }
</style>
