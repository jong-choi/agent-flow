import { type Edge, type Node } from "@xyflow/react";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { FlowNode } from "@/features/canvas/components/flow/flow-node/flow-node";

export const INITIAL_NODES: Node<SidebarNodeData>[] = [];

export const INITIAL_EDGES: Edge[] = [];

export const NODE_TYPE = {
  flowNode: FlowNode,
  startNode: FlowNode,
  endNode: FlowNode,
};

export type NodeType = keyof typeof NODE_TYPE;
