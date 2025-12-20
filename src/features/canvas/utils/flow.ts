import { type Edge, type Node } from "@xyflow/react";
import { FlowCardNode } from "@/features/canvas/components/flow/flow-card-node";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

export const INITIAL_NODES: Node<SidebarItemData>[] = [
  {
    id: "start",
    type: "flowCard",
    position: { x: 180, y: 140 },
    data: {
      label: "시작",
      description: "첫 노드를 추가했습니다",
    },
  },
];

export const INITIAL_EDGES: Edge[] = [];

export const NODE_TYPE = {
  flowCard: FlowCardNode,
};

export type NodeType = keyof typeof NODE_TYPE;
