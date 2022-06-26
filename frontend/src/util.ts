import * as aq from "arquero";
import { get } from "svelte/store";
import {color as _color} from "d3";

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

export function getSlices(t) {
  fetch("/api/slices")
    .then((d) => d.json())
    .then((d) => {
      const slis = JSON.parse(d);
      slis.forEach(
        (s) =>
          (s.idxs = t
            .filter("(d) => " + getFilterFromPredicates(s.predicates))
            .array(get(settings).idColumn))
      );
      getMetrics(slis);

      const sliMap = new Map();
      slis.forEach((e) => sliMap.set(e.name, e));
      slices.set(sliMap);
    });
}

export function updateTab(t: string) {
  if (t === "home") {
    window.location.hash = "";
  } else {
    window.location.hash = "#/" + t + "/";
  }
  return t;
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
            {
              slice: r.slice,
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

export function getFilterFromPredicates(predicates: FilterPredicate[]) {
  const stringPreds = predicates.map((p: FilterPredicate, i) => {
    let join = "";
    if (i !== 0) {
      join = p.join;
    }

    let ret = "";

    if (p.predicateType === "slice") {
      ret = getFilterFromPredicates(get(slices).get(p.name).predicates);
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

export function updateTableColumns(w) {
  let t = get(table);

  const tableColumns = t.columnNames();
  const missingColumns = w.columns.filter((c) => !tableColumns.includes(c));

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
          getSlices(t);
        }
      });
  }
}

export function interpolateColorToArray(
  interpolateColorer: (normalized: number) => string,
  length: number
) {
  const increment = 1.0 / length;
  let colorArray = new Array(length);
  for (let i = 0, t = 0; i < colorArray.length; i++, t += increment) {
    colorArray[i] = _color(interpolateColorer(t)).hex();
  }
  return colorArray;
}