import { type Edge } from "@xyflow/react";

export const pruneEdgesForHandleCount = (
  edges: Edge[],
  {
    nodeId,
    kind,
    nextCount,
  }: { nodeId: string; kind: "target" | "source"; nextCount: number },
) => {
  return edges.filter((edge) => {
    // 무관한 핸들은 통과
    const isRelated =
      kind === "target" ? edge.target === nodeId : edge.source === nodeId;
    if (!isRelated) return true;

    // 타입 가드
    const handle = kind === "target" ? edge.targetHandle : edge.sourceHandle;
    if (!handle) return false;

    // 핸들 이름을 기준으로 edge 제거
    const num = Number(handle.match(/(\d+)$/)?.[1]) || 0;
    return num <= nextCount - 1;
  });
};

export const handleCountRefine: (value: string) => boolean = (value) => {
  if (value.trim() === "") return true;
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 5 && Number.isInteger(num);
};
