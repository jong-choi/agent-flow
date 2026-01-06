import { useCallback } from "react";
import { type Edge, type Node, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function useCheckValidGraph() {
  const { getEdges, getNodes } = useReactFlow();
  const setIsValidGraph = useCanvasStore((s) => s.setIsValidGraph);

  const checkIsValidGraph = useCallback(
    ({ nodes, edges }: { nodes?: Node[]; edges?: Edge[] }) => {
      setIsValidGraph(
        checkValidGraph(nodes ?? getNodes(), edges ?? getEdges()),
      );
    },
    [getEdges, getNodes, setIsValidGraph],
  );

  return checkIsValidGraph;
}

export const checkValidGraph = (nodes: Node[], edges: Edge[]): boolean => {
  const startNodes = nodes.filter((node) => node.type === "startNode");
  const endNodes = nodes.filter((node) => node.type === "endNode");

  if (startNodes.length !== 1 || endNodes.length !== 1) {
    return false;
  }

  const startNode = startNodes[0];
  const endNode = endNodes[0];

  const forwardAdj = new Map<string, string[]>();
  const backwardAdj = new Map<string, string[]>();

  for (const node of nodes) {
    forwardAdj.set(node.id, []);
    backwardAdj.set(node.id, []);
  }

  for (const edge of edges) {
    forwardAdj.get(edge.source)?.push(edge.target);
    backwardAdj.get(edge.target)?.push(edge.source);
  }

  const bfs = (startId: string, adj: Map<string, string[]>): Set<string> => {
    const visited = new Set<string>();
    const queue: string[] = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return visited;
  };

  const reachableFromStart = bfs(startNode.id, forwardAdj);
  const reachableToEnd = bfs(endNode.id, backwardAdj);

  for (const node of nodes) {
    if (!reachableFromStart.has(node.id) || !reachableToEnd.has(node.id)) {
      return false;
    }
  }

  return true;
};
