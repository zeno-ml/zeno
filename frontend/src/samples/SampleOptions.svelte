<script lang="ts">
  import Select, { Option } from "@smui/select";

  import {
    filteredTable,
    currentColumns,
    formattedCurrentColumns,
  } from "../stores";

  import Settings from "../Settings.svelte";
  import SelectionBar from "../metadata/SelectionBar.svelte";

  let sort = "";
  let group = "";
</script>

{#if $filteredTable.size > 0}
  <div id="options-container">
    <div class="options container">
      <Settings />
    </div>
    <div id="selects">
      <div class="select-div">
        <Select bind:value={sort} label="Sort By">
          {#each $currentColumns as m, i}
            <Option value={m}>{$formattedCurrentColumns[i]}</Option>
          {/each}
        </Select>
      </div>
      <div class="select-div">
        <Select bind:value={group} label="Group By">
          {#each $currentColumns as m, i}
            <Option value={m}>{$formattedCurrentColumns[i]}</Option>
          {/each}
        </Select>
      </div>
    </div>
  </div>
  <SelectionBar />
{/if}

<style>
  #selects {
    display: flex;
    flex-direction: inline;
  }
  #options-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgb(224, 224, 224);
    margin-bottom: 10px;
    padding-bottom: 10px;
    margin-right: 20px;
  }
  .options {
    align-items: center;
    justify-content: space-between;
  }
  .select-div {
    margin-left: 20px;
  }
</style>
