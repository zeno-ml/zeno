export class ResultNode {
  name: string;
  depth: number;
  children: Record<string, ResultNode>;
  result: Result;

  constructor(
    name: string,
    depth: number,
    children?: Record<string, ResultNode>,
    result?: Result
  ) {
    this.name = name;
    this.depth = depth;
    this.result = result;
    this.children = children;
  }
}

// Recursive function for creating result tree.
export function appendChild(parent: ResultNode, child: Result) {
  const name = child.slice;

  // Add a leaf node.
  if (name.length === parent.depth + 1) {
    parent.children[name[parent.depth]] = new ResultNode(
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
    parent.children[name[parent.depth]] = new ResultNode(
      name[parent.depth],
      parent.depth + 1,
      {},
      null
    );
    appendChild(parent.children[name[parent.depth]], child);
  }
}

export function isLeaf(node: ResultNode) {
  if (!node.children) {
    return true;
  } else {
    return false;
  }
}

export function leafCount(node: ResultNode) {
  if (!node.children) {
    return 1;
  }
  let count = 0;
  Object.values(node.children).forEach((node) => {
    count += leafCount(node);
  });
  return count;
}
