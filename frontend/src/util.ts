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

export function filterWithPredicates(
  predicates: FilterPredicate[],
  table,
  currentColumns,
  formattedCurrentColumns,
  slices
) {
  const stringPreds = predicates.map((p: FilterPredicate) => {
    if (p.type === "slice") {
      const filt = filterWithPredicates(
        slices.get(p.column).predicates,
        table,
        currentColumns,
        formattedCurrentColumns,
        slices
      );
      if (p.operation === "IS IN") {
        return filt;
      } else {
        return `!(${filt})`;
      }
    }

    if (p.join === "") {
      return (
        `(d["${currentColumns[formattedCurrentColumns.indexOf(p.column)]}"]` +
        " " +
        p.operation +
        " " +
        p.value +
        ")"
      );
    }

    return (
      (p.join === "AND" ? "&&" : "||") +
      " (" +
      `d["${currentColumns[formattedCurrentColumns.indexOf(p.column)]}"]` +
      " " +
      p.operation +
      " " +
      p.value +
      ")"
    );
  });

  return stringPreds.join(" ");
}
