import { type Edge, type Node } from "@xyflow/react";
import { FlowNode } from "@/features/canvas/components/flow/flow-node";
import { StartNodeItem } from "@/features/canvas/constants/node-data";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

const { id, type, ...data } = StartNodeItem;

export const INITIAL_NODES: Node<SidebarItemData>[] = [
  {
    id,
    type,
    data,
    position: { x: 180, y: 140 },
  },
];

export const INITIAL_EDGES: Edge[] = [];

export const NODE_TYPE = {
  flowNode: FlowNode,
  startNode: FlowNode,
  endNode: FlowNode,
};

export type NodeType = keyof typeof NODE_TYPE;
