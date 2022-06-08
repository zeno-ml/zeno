import type ColumnTable from "arquero/dist/types/table/column-table";
import { metrics, models, ready, results, settings } from "./stores";

export function initialFetch() {
  const fetchSettings = fetch("/api/settings")
    .then((r) => r.json())
    .then((s) => settings.set(JSON.parse(s)));
  const fetchModels = fetch("/api/models")
    .then((d) => d.json())
    .then((d) => models.set(JSON.parse(d)));
  const fetchMetrics = fetch("/api/metrics")
    .then((d) => d.json())
    .then((d) => metrics.set(JSON.parse(d)));

  const allRequests = Promise.all([fetchSettings, fetchModels, fetchMetrics]);

  allRequests.then(() => ready.set(true));
}

export function updateTab(t: string) {
  if (t === "home") {
    window.location.hash = "";
  } else {
    window.location.hash = "#/" + t + "/";
  }
  return t;
}

export function getFilteredTable(
  filter: string,
  metadata: string[],
  table: ColumnTable,
  model: string
) {
  let tempFilter = filter;

  metadata.forEach((m) => {
    tempFilter = tempFilter.replaceAll("m." + m, 'd["' + m + '"]');
  });

  if (model) {
    tempFilter = tempFilter.replaceAll("o1", "d.zenomodel_" + model);
  }

  table
    .columnNames()
    .filter((d) => d.startsWith("zenoslice_"))
    .forEach((c) => {
      c = c.substring(10);
      tempFilter = tempFilter.replaceAll("s." + c, 'd["zenoslice_' + c + '"]');
    });

  return table.filter(tempFilter);
}

export function updateResults(requests: ResultsRequest[]) {
  fetch("/api/results", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ requests: requests }),
  })
    .then((d) => d.json())
    .then((res) => {
      res = JSON.parse(res);
      results.update((resmap) => {
        res.forEach((r) => {
          resmap.set(
            {
              slice: r.slice.startsWith("zenoslice_")
                ? r.slice.slice(10)
                : r.slice,
              metric: r.metric,
              model: r.model,
            } as ResultKey,
            r.value
          );
        });
        return resmap;
      });
    })
    .catch((e) => console.log(e));
}
