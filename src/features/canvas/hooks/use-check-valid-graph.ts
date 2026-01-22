import { useCallback } from "react";
import { type Edge, type Node, useReactFlow } from "@xyflow/react";
import { type FlowNodeData } from "@/db/types/sidebar-nodes";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function useCheckValidGraph() {
  const { getEdges, getNodes } = useReactFlow<Node<FlowNodeData>>();
  const setIsValidGraph = useCanvasStore((s) => s.setIsValidGraph);

  const checkIsValidGraph = useCallback(
    ({ nodes, edges }: { nodes?: Node<FlowNodeData>[]; edges?: Edge[] }) => {
      const isValidGraph = checkValidGraph(
        nodes ?? getNodes(),
        edges ?? getEdges(),
      );

      const isValidNodes = (nodes ?? getNodes()).every((node) => {
        return checkValidNode(node).isValid;
      });

      setIsValidGraph(isValidGraph && isValidNodes);
    },
    [getEdges, getNodes, setIsValidGraph],
  );

  return checkIsValidGraph;
}

export const checkValidNode = (
  node: Node<FlowNodeData>,
): { isValid: true } | { isValid: false; message: string } => {
  if (!node.type) {
    return { isValid: false, message: "node.type이 지정되지 않았습니다." };
  }
  if (node.type === "chatNode" && !node.data.content?.value) {
    return { isValid: false, message: "chatNode의 value가 없습니다." };
  }
  return { isValid: true };
};

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
