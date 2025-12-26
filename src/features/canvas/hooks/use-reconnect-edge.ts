import { useCallback } from "react";
import {
  type Connection,
  type Edge,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";

export function useReconnectEdge() {
  const { setEdges, getEdges } = useReactFlow();
  const checkValidGraph = useCheckValidGraph();

  const handleReconnectStart = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, edge: Edge) => {
      const edges = getEdges();
      const nextEdges = edges.filter((e) => e.id !== edge.id);
      checkValidGraph({ edges: nextEdges });
      setEdges(nextEdges);
    },
    [checkValidGraph, getEdges, setEdges],
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const edges = getEdges();
      const nextEdges = addEdge(newConnection, edges);
      checkValidGraph({ edges: nextEdges });
      setEdges(nextEdges);
    },
    [checkValidGraph, getEdges, setEdges],
  );

  return { handleReconnectStart, handleReconnect };
}
