<script lang="ts">
  import Select, { Option } from "@smui/select";
  import IconButton, { Icon } from "@smui/icon-button";
  import Autocomplete from "@smui-extra/autocomplete";
  import { Svg } from "@smui/common/elements";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import { mdiTrashCanOutline } from "@mdi/js";

  import { formattedCurrentColumns, slices } from "../stores";

  export let predicate: FilterPredicate;
  export let deletePredicate: () => void;
  export let first;

  let operations = ["==", "!=", ">", "<", ">=", "<="];

  $: if (!predicate.name || $formattedCurrentColumns.includes(predicate.name)) {
    predicate.predicateType = "metadata";
  } else {
    predicate.predicateType = "slice";
  }
</script>

<div id="group">
  {#if first}
    <span id="where">Where</span>
  {:else}
    <Select
      bind:value={predicate.join}
      label="Operation"
      style="margin-right: 20px;"
    >
      {#each ["AND", "OR"] as o}
        <Option value={o}>{o}</Option>
      {/each}
    </Select>
  {/if}
  {#if predicate.predicateType === "slice"}
    <Select
      bind:value={predicate.operation}
      label="Operation"
      style="margin-right: 20px;"
    >
      {#each ["IS IN", "IS NOT IN"] as o}
        <Option value={o}>{o}</Option>
      {/each}
    </Select>
  {/if}
  <div class="selector">
    <Autocomplete
      options={[...$formattedCurrentColumns, ...$slices.keys()]}
      bind:value={predicate.name}
      label="Metadata or Slice"
    />
  </div>
  {#if predicate.predicateType === "metadata"}
    <div class="selector">
      <Select
        bind:value={predicate.operation}
        label="Operation"
        style="margin-right: 20px;"
      >
        {#each operations as o}
          <Option value={o}>{o}</Option>
        {/each}
      </Select>
    </div>

    <div class="selector">
      <Textfield bind:value={predicate.value} label="Value">
        <HelperText slot="helper">0</HelperText>
      </Textfield>
    </div>
  {/if}
  <div class="selector">
    <IconButton on:click={deletePredicate}>
      <Icon component={Svg} viewBox="0 0 24 24">
        <path fill="currentColor" d={mdiTrashCanOutline} />
      </Icon>
    </IconButton>
  </div>
</div>

<style>
  .selector {
    margin-left: 10px;
    margin-right: 10px;
  }
  #group {
    display: flex;
    flex-direction: inline;
    align-items: flex-start;
  }
  #where {
    margin-top: 15px;
    width: 210px;
  }
</style>
