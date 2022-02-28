<script lang="ts">
  import github from "svelte-highlight/src/styles/github";
  // import * as aq from "arquero";
  import List, {
    Item,
    Text,
    Separator,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";
  import CircularProgress from "@smui/circular-progress";
  import IconButton, { Icon } from "@smui/icon-button";
  import { Svg } from "@smui/common/elements";
  import { mdiGithub } from "@mdi/js";

  import Slices from "./Slices.svelte";
  import Slicers from "./Slicers.svelte";
  import Tests from "./Tests.svelte";
  import Results from "./Results.svelte";
  import ResultView from "./ResultView.svelte";
  import Router, { location } from "svelte-spa-router";
  import Home from "./Home.svelte";

  import { wsResponse, results, models, metric_names } from "./stores";
  import { onMount } from "svelte";

  let runningAnalysis = false;
  let status = "ready";

  const routes = {
    "/": Home,
    "/slicers/": Slicers,
    "/tests/": Tests,
    "/tests/:test?": Tests,
    "/slices/": Slices,
    "/slices/:slicer?": Slices,
    "/results/": Results,
    "/result/:id?": ResultView,
    "*": Home,
  };

  let tab = $location.split("/")[1];
  if (!tab) tab = "home";

  location.subscribe((d) => {
    tab = d.split("/")[1];
    if (!tab) tab = "home";
  });

  function updateTab(t) {
    tab = t;
    if (t === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = "#/" + t + "/";
    }
  }

  async function runAnalysis() {
    if (runningAnalysis) return;
    runningAnalysis = true;
    wsResponse.set({ status: "waiting", results: [] });
  }

  onMount(() => {
    runAnalysis();
  });

  wsResponse.subscribe((r) => {
    status = r.status;
    if (r.status === "done") {
      runningAnalysis = false;
    }
    if (r.results.length > 0) {
      let res = JSON.parse(r.results) as Result[];
      if (res.length === 0) return;
      let m = [];
      Object.keys(res[0].modelResults).forEach((d) => m.push(d));
      results.set(res);
      models.set(m);
    }
  });
  onMount(() => {
    fetch("/api/metrics")
      .then((d) => d.json())
      .then((d) => {
        d = JSON.parse(d);
        metric_names.set(d.map((m) => m.name));
      });
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

  <IconButton href="https://github.com/cabreraalex/zeno">
    <Icon component={Svg} viewBox="0 0 24 24">
      <path fill="currentColor" d={mdiGithub} />
    </Icon>
  </IconButton>
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
      <br />
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
      <br />
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
        <p>{@html status}</p>
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
