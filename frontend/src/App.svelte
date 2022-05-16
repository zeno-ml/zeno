<script lang="ts">
  import type ColumnTable from "arquero/dist/types/table/column-table";

  import {
    mdiApi,
    mdiGithub,
    mdiGraphql,
    mdiListStatus,
    mdiTestTube,
  } from "@mdi/js";
  import CircularProgress from "@smui/circular-progress";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import List, { Item, Separator } from "@smui/list";
  import Tooltip, { Wrapper } from "@smui/tooltip";
  import { onMount } from "svelte";
  import Router, { location } from "svelte-spa-router";
  import * as aq from "arquero";

  import Embed from "./Embed.svelte";
  import Results from "./Results.svelte";
  import Tests from "./Tests.svelte";

  import { initialFetch, updateResults, updateTab } from "./util";
  import { settings, status, table, wsResponse } from "./stores";

  let runningAnalysis = true;
  let tab = $location.split("/")[1];
  if (!tab) {
    tab = "results";
  }

  const routes = {
    "/": Results,
    "/results/": Results,
    "/embed/": Embed,
    "/tests/": Tests,
    "*": Results,
  };

  location.subscribe((d) => {
    tab = d.split("/")[1];
    if (!tab) {
      tab = "results";
    }
  });

  status.subscribe((s) => {
    if (s.startsWith("Done")) {
      runningAnalysis = false;
    } else {
      runningAnalysis = true;
    }
  });

  wsResponse.subscribe((w) => {
    let tableColumns = $table.columnNames();
    let missingColumns = w.columns.filter((c) => !tableColumns.includes(c));
    if (missingColumns.length > 0) {
      fetch("/api/table", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ columns: missingColumns }),
      })
        .then((d) => d.json())
        .then((d) => {
          const x = {};
          Object.keys(d).forEach((k) => {
            x[k] = Object.values(d[k]);
          });
          let t: ColumnTable;
          if ($table.size === 0) {
            t = aq.fromJSON(x);
            table.set(t);
          } else {
            t = $table.assign(aq.fromJSON(x));
            table.set(t);
          }

          let requests: ResultsRequest[] = [];
          missingColumns.forEach((c) => {
            if (c.startsWith("zenoslice_")) {
              let idxs = t.filter(`d => d["${c}"] !== null`);
              requests.push({
                sli: c,
                idxs: idxs.array($settings.idColumn) as string[],
              });
            }
          });
          updateResults(requests);
        });
    }
  });

  onMount(() => initialFetch());
</script>

<header>
  <div
    style="display:flex; flex-direction:inline; align-items:center; justify-content: center;"
  >
    <img
      style="width:100px; margin-right: 50px;"
      src="zeno.png"
      alt="Square spiral logo next to 'Zeno'"
    />
    <div
      class="status"
      style="display:flex; flex-direction:inline; align-items:center; justify-content: center;"
    >
      {#if runningAnalysis}
        <CircularProgress
          style="height: 32px; width: 32px; margin-right:20px"
          indeterminate
        />
        <span>{@html $status}</span>
      {/if}
    </div>
  </div>

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
    <List class="demo-list" iconList={true}>
      <Item
        activated={tab === "results"}
        on:SMUI:action={() => (tab = updateTab("results"))}
      >
        <IconButton>
          <Icon component={Svg} viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiListStatus} />
          </Icon>
        </IconButton>
      </Item>
      <Separator />
      <Item
        activated={tab === "embed"}
        on:SMUI:action={() => (tab = updateTab("embed"))}
      >
        <IconButton>
          <Icon component={Svg} viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiGraphql} />
          </Icon>
        </IconButton>
      </Item>
      <Separator />
      <Item
        activated={tab === "tests"}
        on:SMUI:action={() => (tab = updateTab("tests"))}
      >
        <IconButton>
          <Icon component={Svg} viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiTestTube} />
          </Icon>
        </IconButton>
      </Item>
      <Separator />
    </List>
  </div>
  <div id="main">
    <Router {routes} />
  </div>
</main>

<style>
  * :global(.demo-list) {
    max-width: 50px;
  }
  * :global(.mdc-deprecated-list-item) {
    padding-left: 0px;
  }
  main {
    display: flex;
    flex-direction: row;
    text-align: left;
  }

  header {
    background: var(--mdc-theme-background);
    padding: 1em;
    border-bottom: 1px solid #e0e0e0;
  }

  #side-menu {
    width: 50px;
    border-right: 1px solid #e0e0e0;
    height: calc(100vh - 74px);
  }

  #main {
    padding-left: 10px;
    width: calc(100vw - 50px);
  }

  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-top: 0px;
    padding-bottom: 0px;
    padding-right: 20px;
    padding-left: 20px;
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
