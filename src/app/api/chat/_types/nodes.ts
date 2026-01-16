import { type Edge, type Node } from "@xyflow/react";
import { type FlowNodeData } from "@/db/query/sidebar-nodes";

export type FlowNode = Node<
  Omit<FlowNodeData, "createdAt"> & { createdAt: string }
>;
export type FlowEdge = Edge;

export const nodeTypes = [
  "startNode",
  "splitNode",
  "promptNode",
  "chatNode",
  "searchNode",
  "mergeNode",
  "endNode",
] as const;

type NodeType = (typeof nodeTypes)[number];

export const isValidNodeType = (type: string): type is NodeType => {
  return nodeTypes.includes(type as NodeType);
};

export type DynamicNodeType = NodeType | "__start__" | "__end__";
