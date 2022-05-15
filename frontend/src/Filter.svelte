<script lang="ts">
  import { settings, slices } from "./stores";

  export let filter;
  export let createSlice;

  let inputFocused = false;
  let filterSuggestions = ["s. - slices", "m. - metadata"];
  let suggestionElements: HTMLDivElement[] = [];

  $: {
    filter;
    updateSuggestions();
  }

  function updateSuggestions() {
    let lastFilter = filter.split(" ").pop();

    if (lastFilter.startsWith("s.")) {
      filterSuggestions = [...$slices.keys()]
        .filter((s) => s.startsWith(lastFilter.substring(2)))
        .map((s) => "s." + s);
    } else if (lastFilter.startsWith("m.")) {
      filterSuggestions = $settings.metadata
        .filter((s) => s.startsWith(lastFilter.substring(2)))
        .map((s) => "m." + s);
    } else {
      filterSuggestions = [
        "use JS syntax to filter, e.g &&, >, <",
        "s - slices",
        "m - metadata",
        "o1 - model A output",
        "o2 - model B output",
      ];
    }
  }

  function setSuggestion(sugg) {
    filter = filter.replace(filter.split(" ").pop(), sugg + " ");
  }

  $: document.activeElement;
</script>

<input
  on:focusin={() => (inputFocused = true)}
  on:focusout={() => (inputFocused = false)}
  bind:value={filter}
  on:keydown={(e) => {
    if (e.key === "ArrowDown") {
      suggestionElements[0].focus();
    }
    e.key === "Enter" ? createSlice() : "";
  }}
  style:margin-left="10px"
  type="text"
  placeholder="Create new slice"
/>
<div id="suggestions" style:display={inputFocused ? "initial" : "none"}>
  {#each filterSuggestions as suggestion, i}
    <div
      bind:this={suggestionElements[i]}
      class="suggestion"
      on:click={() => setSuggestion(suggestion)}
    >
      {suggestion}
    </div>
  {/each}
</div>

<style>
  input {
    height: 30px;
    font-family: consolas;
    margin-left: 10px;
    padding-left: 10px;
    width: 400px;
    border-color: #e0e0e0;
  }
  #suggestions {
    position: fixed;
    margin-left: 10px;
    background: white;
    z-index: 1;
    padding: 10px;
    border: 1px solid #efefef;
    width: 395px;
    margin-top: 35px;
  }
  .suggestion {
    font-family: consolas;
    padding-top: 5px;
    padding-bottom: 5px;
    border-bottom: 1px solid #efefef;
    box-shadow: 1px 1px #efefef;
  }
</style>
