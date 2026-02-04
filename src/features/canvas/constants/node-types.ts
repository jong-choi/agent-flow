export const nodeTypes = [
  "startNode",
  "splitNode",
  "promptNode",
  "chatNode",
  "searchNode",
  "documentNode",
  "mergeNode",
  "endNode",
] as const;

export type NodeType = (typeof nodeTypes)[number];
