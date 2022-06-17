<script lang="ts">
  import Select, { Option } from "@smui/select";
  import { metrics, models, metric, model } from "./stores";
</script>

{#if $models}
  <Select bind:value={$model} label="Model" style="margin-right: 20px;">
    {#each $models as m}
      <Option value={m}>{m}</Option>
    {/each}
  </Select>
{/if}
{#if $metrics}
  <Select bind:value={$metric} label="Metric" style="margin-right: 20px;">
    {#each $metrics as m}
      <Option value={m}>{m}</Option>
    {/each}
  </Select>
{/if}
