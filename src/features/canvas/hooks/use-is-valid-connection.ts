import {
  type Connection,
  type Edge,
  type IsValidConnection,
  useReactFlow,
} from "@xyflow/react";

export function useIsValidConnection() {
  const { getEdges } = useReactFlow();

  const isValidConnection: IsValidConnection = (
    connection: Connection | Edge,
  ) => {
    const edges = getEdges();
    return checkValidConnection(connection, edges);
  };

  return isValidConnection;
}

export const checkValidConnection = (
  connection: Connection | Edge,
  edges: Edge[],
) => {
  // source나 target이 없으면 invalid
  if (!connection.source || !connection.target) {
    return false;
  }

  // 같은 노드끼리 연결 방지
  if (connection.source === connection.target) {
    return false;
  }

  // 같은 source-target 노드 쌍 간의 중복 연결 방지
  const hasDuplicateConnection = edges.some(
    (edge) =>
      edge.source === connection.source && edge.target === connection.target,
  );
  if (hasDuplicateConnection) {
    return false;
  }

  // 이미 사용중인 source 핸들 체크
  const isSourceHandleUsed = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.sourceHandle === connection.sourceHandle,
  );
  if (isSourceHandleUsed) {
    return false;
  }

  // 이미 사용중인 target 핸들 체크
  const isTargetHandleUsed = edges.some(
    (edge) =>
      edge.target === connection.target &&
      edge.targetHandle === connection.targetHandle,
  );
  if (isTargetHandleUsed) {
    return false;
  }

  return true;
};
