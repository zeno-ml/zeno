<script lang="ts">
  import { mdiApi, mdiGithub } from "@mdi/js";
  import CircularProgress from "@smui/circular-progress";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import List, {
    Item,
    PrimaryText,
    SecondaryText,
    Separator,
    Text,
  } from "@smui/list";
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { onMount } from "svelte";
  import github from "svelte-highlight/src/styles/github";
  import Router, { location } from "svelte-spa-router";
  import Home from "./Home.svelte";
  import Results from "./Results.svelte";
  import Slices from "./Slices.svelte";
  import { metrics, slices, status, wsResponse } from "./stores";

  const routes = {
    "/": Home,
    "/slices/": Slices,
    "/slices/:slicer?": Slices,
    "/results/": Results,
    "*": Home,
  };

  let runningAnalysis = true;
  let fetchedSlices = false;

  let tab = $location.split("/")[1];
  if (!tab) {
    tab = "home";
  }

  location.subscribe((d) => {
    tab = d.split("/")[1];
    if (!tab) {
      tab = "home";
    }
  });

  function updateTab(t: string) {
    tab = t;
    if (t === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = "#/" + t + "/";
    }
  }

  onMount(() => {
    wsResponse.set({
      status: "connecting",
      results: [],
    } as WSResponse);
  });

  status.subscribe((s) => {
    // If running analysis or done, get the slices and metrics.
    if (!fetchedSlices && (s === "Done" || s.startsWith("Model"))) {
      fetchedSlices = true;
      fetch("/api/slices")
        .then((d) => d.json())
        .then((d) => {
          const out = JSON.parse(d) as Slice[];
          const retMap = new Map<string, Slice>();
          out.forEach((s) => {
            retMap.set(s.name.join(""), s);
          });
          slices.set(retMap);
        });
      fetch("/api/metrics")
        .then((d) => d.json())
        .then((d) => metrics.set(JSON.parse(d) as Metric[]));
    }
    if (s === "Done") {
      runningAnalysis = false;
    } else {
      runningAnalysis = true;
    }
  });
</script>

<svelte:head>
  {@html github}
</svelte:head>

<header>
  <img
    style="width:150px"
    src="zeno.png"
    alt="Square spiral logo next to 'Zeno'"
  />

  <div>
    <Wrapper>
      <IconButton href="https://cabreraalex.github.io/zeno/intro.html">
        <Icon component={Svg} viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiApi} />
        </Icon>
      </IconButton>
      <Tooltip>read the documentation</Tooltip>
    </Wrapper>
    <Wrapper>
      <IconButton href="https://github.com/cabreraalex/zeno">
        <Icon component={Svg} viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiGithub} />
        </Icon>
      </IconButton>
      <Tooltip>see the code on GitHub</Tooltip>
    </Wrapper>
  </div>
</header>
<main>
  <div id="side-menu">
    <List class="demo-list">
      <Item activated={tab === "home"} on:SMUI:action={() => updateTab("home")}>
        <Text>
          <PrimaryText>Home</PrimaryText>
          <SecondaryText>Overview of tests</SecondaryText>
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
    <div class="status">
      {#if runningAnalysis}
        <CircularProgress style="height: 32px; width: 32px;" indeterminate />
        <br />
        <p>{@html $status}</p>
      {/if}
    </div>
  </div>
  <div id="main">
    <Router {routes} />
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: row;
    text-align: left;
    padding-bottom: 50px;
  }

  .status {
    padding: 15px;
  }

  header {
    background: var(--mdc-theme-background);
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
    width: calc(100vw - 300px);
  }

  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-right: 50px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  img {
    align-self: center;
  }
</style>
