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
  const name = child.name[0];

  // Add a leaf node.
  if (name.length === parent.depth + 1) {
    parent.children[name[parent.depth]] = new SliceNode(
      name[parent.depth],
      parent.depth + 1,
      null,
      child
    );
    return;
  }

  // If child exists, add to it. Else, create it and add to it.
  const childNode = parent.children[name[parent.depth]];
  if (childNode) {
    childNode[name[parent.depth]] = appendChild(childNode, child);
  } else {
    parent.children[name[parent.depth]] = new SliceNode(
      name[parent.depth],
      parent.depth + 1,
      {},
      null
    );
    appendChild(parent.children[name[parent.depth]], child);
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

export function sliceEquals(s1: string[][], s2: string[][]) {
  if (s1.length !== s2.length) {
    return false;
  }
  const s1String = s1.map((s) => s.join(""));
  const s2String = s2.map((s) => s.join(""));
  for (let i = 0; i < s1.length; i++) {
    let localEquals = false;
    for (let j = 0; j < s2.length; j++) {
      if (s1String[i] === s2String[j]) {
        localEquals = true;
        break;
      }
    }
    if (!localEquals) {
      return false;
    }
  }
  return true;
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
