import * as aq from "arquero";
import { get } from "svelte/store";
import { tab } from "./stores";

import {
  currentColumns,
  formattedCurrentColumns,
  metrics,
  models,
  ready,
  results,
  settings,
  slices,
  table,
  reports,
} from "./stores";

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

export async function getSlicesAndReports(t) {
  const slicesRes = await fetch("/api/slices").then((d) => d.json());
  const slis = JSON.parse(slicesRes) as Slice[];
  slis.forEach(
    (s: Slice) =>
      (s.idxs = t
        .filter("(d) => " + getFilterFromPredicates(s.filterPredicates))
        .array(get(settings).idColumn))
  );
  getMetrics(slis);
  const sliMap = new Map();
  slis.forEach((e) => sliMap.set(e.sliceName, e));
  slices.set(sliMap);

  // todo: get reports
  const reportsRes = await fetch("/api/reports").then((d) => d.json());
  const localReports = JSON.parse(reportsRes) as Report[];
  reports.set(localReports);
}

export function updateTab(t: string) {
  if (t === "home") {
    window.location.hash = "";
  } else {
    window.location.hash = "#/" + t + "/";
  }
  tab.set(t);
}

export function getMetrics(slices: Slice[]) {
  console.log(slices);
  fetch("/api/results", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ slices: slices }),
  })
    .then((d) => d.json())
    .then((res) => {
      res = JSON.parse(res);
      results.update((resmap) => {
        res.forEach((r) => {
          resmap.set(
            <ResultKey>{
              slice: r.slice,
              metric: r.metric,
              model: r.model,
            },
            r.value
          );
        });
        return resmap;
      });
    })
    .catch((e) => console.log(e));
}

export function getFilterFromPredicates(predicates: FilterPredicate[]) {
  const stringPreds = predicates.map((p: FilterPredicate, i) => {
    let join = "";
    if (i !== 0) {
      join = p.join;
    }

    let ret = "";

    if (p.predicateType === "slice") {
      ret = getFilterFromPredicates(get(slices).get(p.name).filterPredicates);
      if (p.operation === "IS IN") {
        return ret;
      } else {
        return `!(${ret})`;
      }
    }

    if (p.groupIndicator === "start" && join) {
      ret += "&& (";
    } else if (p.groupIndicator === "start") {
      ret += "(";
    }

    if (join === "") {
      ret +=
        `(d["${
          get(currentColumns)[get(formattedCurrentColumns).indexOf(p.name)]
        }"]` +
        " " +
        p.operation +
        " " +
        (isNaN(parseFloat(p.value)) ? `"${p.value}"` : p.value) +
        ")";
    } else {
      ret +=
        (join === "AND" ? "&&" : "||") +
        " (" +
        `d["${
          get(currentColumns)[get(formattedCurrentColumns).indexOf(p.name)]
        }"]` +
        " " +
        p.operation +
        " " +
        (isNaN(parseFloat(p.value)) ? `"${p.value}"` : p.value) +
        ")";
    }

    if (p.groupIndicator === "end") {
      ret += ")";
    }

    return ret;
  });

  return stringPreds.join(" ");
}

export function updateTableColumns(w: WSResponse) {
  let t = get(table);

  const tableColumns = t.columnNames();
  const missingColumns = w.completeColumns.filter(
    (c) => !tableColumns.includes(c)
  );

  if (missingColumns.length > 0) {
    fetch("/api/table", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ columns: missingColumns }),
    })
      .then((d: Response) => d.arrayBuffer())
      .then((d) => {
        if (t.size === 0) {
          t = aq.fromArrow(d);
        } else {
          t = t.assign(aq.fromArrow(d));
        }
        table.set(t);

        // TODO: move somewhere more logical.
        if (get(slices).size === 0 && w.doneProcessing) {
          getSlicesAndReports(t);
        }
      });
  }
}

export function updateReports(reps) {
  console.log(reps);
  fetch("/api/update-reports", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ reports: reps }),
  }).then((d: Response) => d.json());
}
