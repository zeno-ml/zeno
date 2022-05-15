import type ColumnTable from "arquero/dist/types/table/column-table";
import { metrics, models, ready, settings } from "./stores";

export class SliceNode {
  name: string;
  depth: number;
  children: Record<string, SliceNode>;
  slice: Slice;

  constructor(
    name: string,
    depth: number,
    children?: Record<string, SliceNode>,
    slice?: Slice
  ) {
    this.name = name;
    this.depth = depth;
    this.slice = slice;
    this.children = children;
  }
}

// Recursive function for creating result tree.
export function appendChild(parent: SliceNode, child: Slice) {
  let name = child.name;
  if (name.startsWith("zenoslice_")) {
    name = name.slice(9);
  }
  const name_parts = name.split(".");

  // Add a leaf node.
  if (name_parts.length === parent.depth + 1) {
    parent.children[name_parts[parent.depth]] = new SliceNode(
      name_parts[parent.depth],
      parent.depth + 1,
      null,
      child
    );
    return;
  }

  // If child exists, add to it. Else, create it and add to it.
  const childNode = parent.children[name_parts[parent.depth]];
  if (childNode) {
    childNode[name_parts[parent.depth]] = appendChild(childNode, child);
  } else {
    parent.children[name_parts[parent.depth]] = new SliceNode(
      name_parts[parent.depth],
      parent.depth + 1,
      {},
      null
    );
    appendChild(parent.children[name_parts[parent.depth]], child);
  }
}

export function isLeaf(node: SliceNode) {
  if (!node.children) {
    return true;
  } else {
    return false;
  }
}

export function leafCount(node: SliceNode) {
  if (!node.children) {
    return 1;
  }
  let count = 0;
  Object.values(node.children).forEach((node) => {
    count += leafCount(node);
  });
  return count;
}

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
  modelA: string,
  modelB: string
) {
  let tempFilter = filter;

  metadata.forEach((m) => {
    tempFilter = tempFilter.replaceAll("m." + m, 'd["' + m + '"]');
  });

  if (modelA) {
    tempFilter = tempFilter.replaceAll("o1", "d.zenomodel_" + modelA);
  }
  if (modelB) {
    tempFilter = tempFilter.replaceAll("o2", "d.zenomodel_" + modelB);
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

export function sendResultRequests(reqs: ResultRequest[]) {
  fetch("/api/results", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ requests: reqs }),
  }).catch((e) => console.log(e));
}
