import { type RefObject } from "react";
import { type Node } from "@xyflow/react";
import {
  type SidebarItem,
  type SidebarItemData,
} from "@/features/canvas/types/sidebar-item";

type AddNodeParams = {
  currentNodes: Node<SidebarItemData>[];
  item: SidebarItem;
  flowWrapperRef: RefObject<HTMLDivElement | null>;
  screenToFlowPosition: (position: { x: number; y: number }) => {
    x: number;
    y: number;
  };
};

export const addNodeToCenter = ({
  currentNodes,
  item,
  flowWrapperRef,
  screenToFlowPosition,
}: AddNodeParams) => {
  const rect = flowWrapperRef.current?.getBoundingClientRect();
  if (!rect) return currentNodes;

  const center = screenToFlowPosition({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  });

  const nextNode: Node<SidebarItemData> = {
    id: `${item.id}-${Date.now()}`, // 충돌 방지용 간단 id
    type: "flowCard",
    position: center,
    data: {
      label: item.label,
      description: item.description ?? "",
    },
  };

  return [...currentNodes, nextNode];
};
