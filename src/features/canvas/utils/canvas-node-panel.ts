import { type Edge } from "@xyflow/react";

export const pruneEdgesForHandleCount = (
  edges: Edge[],
  {
    nodeId,
    kind,
    nextCount,
  }: { nodeId: string; kind: "target" | "source"; nextCount: number },
) => {
  return edges;
};

export const handleCountRefine: (value: string) => boolean = (value) => {
  return true;
};
