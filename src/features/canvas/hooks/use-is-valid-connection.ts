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
  return true;
};
