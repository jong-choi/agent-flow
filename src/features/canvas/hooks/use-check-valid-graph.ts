import { useCallback } from "react";
import { type Edge, type Node } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { type GraphValidationMessageCode } from "@/features/canvas/constants/graph-validation-message";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

type ValidationResult =
  | { isValid: true }
  | { isValid: false; message: GraphValidationMessageCode };

export function useCheckValidGraph() {
  const { getEdges, getNodes } = useCanvasReactFlow();
  const setIsValidGraph = useCanvasStore((s) => s.setIsValidGraph);
  const setIsValidGraphMessage = useCanvasStore(
    (s) => s.setIsValidGraphMessage,
  );

  const checkIsValidGraph = useCallback(
    ({ nodes, edges }: { nodes?: FlowCanvasNode[]; edges?: Edge[] }) => {
      const nextNodes = nodes ?? getNodes();
      const nextEdges = edges ?? getEdges();
      const graphResult = checkValidGraphDetailed(nextNodes, nextEdges);

      if (!graphResult.isValid) {
        setIsValidGraph(false);
        setIsValidGraphMessage(graphResult.message);
        return;
      }

      for (const node of nextNodes) {
        const nodeResult = checkValidNode(node);
        if (!nodeResult.isValid) {
          setIsValidGraph(false);
          setIsValidGraphMessage(nodeResult.message);
          return;
        }
      }

      setIsValidGraph(true);
      setIsValidGraphMessage(null);
    },
    [getEdges, getNodes, setIsValidGraph, setIsValidGraphMessage],
  );

  return checkIsValidGraph;
}

export const checkValidNode = (node: FlowCanvasNode): ValidationResult => {
  if (!node.type) {
    return { isValid: false, message: "nodeTypeMissing" };
  }
  if (node.type === "chatNode" && !node.data.content?.value) {
    return { isValid: false, message: "chatNodeValueMissing" };
  }
  if (node.type === "documentNode") {
    const referenceId = node.data.content?.referenceId;
    if (typeof referenceId !== "string" || referenceId.trim().length === 0) {
      return {
        isValid: false,
        message: "documentNodeReferenceMissing",
      };
    }
  }
  return { isValid: true };
};

export const checkValidGraph = (nodes: Node[], edges: Edge[]): boolean => {
  return checkValidGraphDetailed(nodes, edges).isValid;
};

export const checkValidGraphDetailed = (
  nodes: Node[],
  edges: Edge[],
): ValidationResult => {
  const startNodes = nodes.filter((node) => node.type === "startNode");
  const endNodes = nodes.filter((node) => node.type === "endNode");

  if (startNodes.length !== 1) {
    return { isValid: false, message: "startNodeCountInvalid" };
  }

  if (endNodes.length !== 1) {
    return { isValid: false, message: "endNodeCountInvalid" };
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
      return { isValid: false, message: "disconnectedNodeExists" };
    }
  }

  return { isValid: true };
};
