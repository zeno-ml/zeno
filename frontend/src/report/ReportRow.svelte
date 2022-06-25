<script lang="ts">
  import { Icon } from "@smui/button";
  import Ripple from "@smui/ripple";
  import Textfield from "@smui/textfield";

  import { reports, report } from "../stores";
  import { clickOutside } from "../clickOutside";

  export let i;

  let rep = $reports[i];
  let name = rep.name;

  //   let nameField;

  let editMode = false;
</script>

<div
  use:Ripple={{ surface: true, color: "primary" }}
  class="report {$report === i ? 'selected' : ''}"
  on:click={() => {
    report.set(i);
  }}
  use:clickOutside
  on:click_outside={() => {
    editMode = false;
    reports.update((reps) => {
      reps[i].name = name;
      return reps;
    });
  }}
>
  {#if !editMode}
    <p>{rep.name}</p>
  {:else}
    <Textfield bind:value={name} />
  {/if}

  <div style:cursor="pointer">
    <Icon
      class="material-icons"
      on:click={(e) => {
        e.stopPropagation();
        editMode = !editMode;
        // editMode ? nameField.getElement().focus() : "";
      }}
    >
      edit
    </Icon>
    <Icon
      class="material-icons"
      on:click={(e) => {
        e.stopPropagation();
        reports.update((reps) => {
          reps.splice(i, 1);
          return reps;
        });
      }}
    >
      delete
    </Icon>
  </div>
</div>

<style>
  .report {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 0.5px solid rgb(224, 224, 224);
    border-top: 0.5px solid rgb(224, 224, 224);
    padding-left: 10px;
    padding-right: 10px;
  }
  .selected {
    background: #ebdffc;
  }
</style>
