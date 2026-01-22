export const nodeTypes = [
  "startNode",
  "splitNode",
  "promptNode",
  "chatNode",
  "searchNode",
  "mergeNode",
  "endNode",
] as const;

export type NodeType = (typeof nodeTypes)[number];
