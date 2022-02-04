<script lang="ts">
  import github from "svelte-highlight/src/styles/github";
  import * as aq from "arquero";
  import List, {
    Item,
    Text,
    Separator,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";

  import Slices from "./Slices.svelte";
  import Slicers from "./Slicers.svelte";
  import Tests from "./Tests.svelte";
  import Results from "./Results.svelte";
  import Router, { location } from "svelte-spa-router";
  import Home from "./Home.svelte";

  const routes = {
    "/": Home,
    "/slicers/": Slicers,
    "/tests/": Tests,
    "/tests/:test": Tests,
    "/slices/": Slices,
    "/results/": Results,
    "*": Home,
  };

  fetch("/api/data")
    .then((d) => d.arrayBuffer())
    .then((d) => {
      let data = aq.fromArrow(d);
      console.log(data.columnNames());
      console.log(data.totalRows());
    });

  let tab = $location.split("/")[1];
  if (!tab) tab = "home";

  function updateTab(t) {
    tab = t;
    if (t === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = "#/" + t + "/";
    }
  }
</script>

<svelte:head>
  {@html github}
</svelte:head>

<header>
  <h1>MLTest</h1>
</header>
<main>
  <div id="side-menu">
    <List class="demo-list">
      <Item activated={tab === "home"} on:SMUI:action={() => updateTab("home")}>
        <Text>
          <PrimaryText>Home</PrimaryText>
          <!-- <SecondaryText>Data slicing functions</SecondaryText> -->
        </Text>
      </Item>
      <Separator />
      <Item
        activated={tab === "slicers"}
        on:SMUI:action={() => updateTab("slicers")}
      >
        <Text>
          <PrimaryText>Slicers</PrimaryText>
          <SecondaryText>Data slicing functions</SecondaryText>
        </Text>
      </Item>
      <Separator />
      <Item
        activated={tab === "tests"}
        on:SMUI:action={() => updateTab("tests")}
      >
        <Text>
          <PrimaryText>Tests</PrimaryText>
          <SecondaryText>Testing functions</SecondaryText>
        </Text>
      </Item>
      <Separator />
      <Item
        activated={tab === "slices"}
        on:SMUI:action={() => updateTab("slices")}
      >
        <Text>
          <PrimaryText>Slices</PrimaryText>
          <SecondaryText>Generated slices</SecondaryText>
        </Text>
      </Item>
      <Separator />
      <Item
        activated={tab === "results"}
        on:SMUI:action={() => updateTab("results")}
      >
        <Text>
          <PrimaryText>Results</PrimaryText>
          <SecondaryText>Test results on slices</SecondaryText>
        </Text>
      </Item>
      <Separator />
    </List>
  </div>
  <div id="main">
    <Router {routes} />
    <!-- {#if tab === "Slicers"}
      <Slicers />
    {:else if tab === "Tests"}
      <Tests />
    {:else if tab === "Slices"}
      <Slices />
    {:else}
      <Results />
    {/if} -->
    <!-- {#if code.length > 0}
    <Highlight language={python} {code} />
  {/if}
  {#if test.length > 0}
    <Highlight language={python} code={test} />
  {/if} -->
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: row;
    text-align: left;
    max-width: 240px;
  }

  header {
    background: #ebdffc;
    padding: 1em;
    border-bottom: 1px solid #e0e0e0;
  }

  #side-menu {
    width: 200px;
    border-right: 1px solid #e0e0e0;
    height: calc(100vh - 74px);
  }

  #main {
    margin-left: 20px;
  }

  h1 {
    margin: 0px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
