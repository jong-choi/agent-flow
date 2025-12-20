import { type Edge, type Node } from "@xyflow/react";
import { FlowCardNode } from "@/features/canvas/components/flow/flow-card-node";
import {
  type SidebarItem,
  type SidebarItemData,
} from "@/features/canvas/types/sidebar-item";

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

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "task",
    label: "업무",
    description: "할 일을 표현하는 노드",
    type: "flowCard",
  },
  {
    id: "decision",
    label: "결정",
    description: "분기 처리를 위한 노드",
    type: "flowCard",
  },
  {
    id: "api",
    label: "API",
    description: "외부 호출을 나타내는 노드",
    type: "flowCard",
  },
  {
    id: "note",
    label: "메모",
    description: "참고용 메모 블록",
    type: "flowCard",
  },
];
