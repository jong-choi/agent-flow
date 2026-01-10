import { type Edge } from "@xyflow/react";

export const pruneEdgesForHandleCount = (
  edges: Edge[],
  {
    nodeId,
    kind,
    nextCount,
  }: { nodeId: string; kind: "target" | "source"; nextCount: number },
) => {
  let shouldUpdate = false;

  const related: { edge: Edge; idx: number }[] = [];
  const unrelated: Edge[] = [];

  for (const edge of edges) {
    const isRelated =
      kind === "target" ? edge.target === nodeId : edge.source === nodeId;

    if (!isRelated) {
      unrelated.push(edge);
      continue;
    }

    const handle = kind === "target" ? edge.targetHandle : edge.sourceHandle;

    if (!handle) {
      shouldUpdate = true;
      continue;
    }

    const idx = Number(handle.match(/(\d+)$/)?.[1] ?? 0);
    related.push({ edge, idx });
  }

  related.sort((a, b) => a.idx - b.idx);

  // slice 후 재매핑하여 압축
  const sliced = related.slice(0, nextCount);
  if (sliced.length !== related.length) {
    shouldUpdate = true;
  }

  const kept = sliced.map((item, newIdx) => {
    const key = kind === "target" ? "targetHandle" : "sourceHandle";
    const nextHandle = `${kind}${newIdx}`;

    if (!shouldUpdate && item.edge[key] !== nextHandle) {
      shouldUpdate = true;
    }

    item.edge[key] = nextHandle;
    return item.edge;
  });

  const nextEdges = [...unrelated, ...kept];

  return { shouldUpdate, nextEdges };
};

export const handleCountRefine: (value: string) => boolean = (value) => {
  if (value.trim() === "") return true;
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 5 && Number.isInteger(num);
};
