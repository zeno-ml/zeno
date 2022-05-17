<script lang="ts">
  import { mdiGraphql, mdiListStatus, mdiTestTube } from "@mdi/js";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import List, { Item, Separator } from "@smui/list";
  import * as aq from "arquero";
  import type ColumnTable from "arquero/dist/types/table/column-table";
  import { onMount } from "svelte";
  import Router, { location } from "svelte-spa-router";

  import Embed from "./Embed.svelte";
  import Header from "./Header.svelte";
  import Results from "./Results.svelte";
  import Tests from "./Tests.svelte";
  import { settings, slices, table, wsResponse } from "./stores";
  import { initialFetch, updateResults, updateTab } from "./util";

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
          } else {
            t = $table.assign(aq.fromJSON(x));
          }
          table.set(t);

          let requests: ResultsRequest[] = [];
          missingColumns.forEach((c) => {
            if (c.startsWith("zenoslice_")) {
              let idxs = t.filter(`d => d["${c}"] !== null`);
              slices.update((s) => {
                s.set(c.slice(10), {
                  name: c.slice(10),
                  type: "programmatic",
                  size: idxs.size,
                });
                return s;
              });
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

<Header />
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

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
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
</style>
