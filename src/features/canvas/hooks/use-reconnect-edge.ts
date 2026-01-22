import { useCallback } from "react";
import { type Connection, type Edge, addEdge } from "@xyflow/react";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";

export function useReconnectEdge() {
  const { setEdges, getEdges } = useCanvasReactFlow();

  const handleReconnectStart = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, edge: Edge) => {
      const edges = getEdges();
      const nextEdges = edges.filter((e) => e.id !== edge.id);
      setEdges(nextEdges);
    },
    [getEdges, setEdges],
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const edges = getEdges();
      const nextEdges = addEdge(newConnection, edges);
      setEdges(nextEdges);
    },
    [getEdges, setEdges],
  );

  return { handleReconnectStart, handleReconnect };
}
