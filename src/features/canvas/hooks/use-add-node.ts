import { useCallback } from "react";
import { type Node, type XYPosition, useReactFlow } from "@xyflow/react";
import {
  type SidebarItem,
  type SidebarItemData,
} from "@/features/canvas/types/sidebar-item";

export function useAddNode() {
  const { fitView, setNodes } = useReactFlow();

  const handleAddNode = useCallback(
    (item: SidebarItem, position: XYPosition) => {
      const nextNode: Node<SidebarItemData> = {
        id: `${item.id}-${Date.now()}`,
        type: item.type,
        position,
        data: {
          label: item.label,
          description: item.description ?? "",
        },
      };

      setNodes((current) => [...current, nextNode]);
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    },
    [fitView, setNodes],
  );

  return handleAddNode;
}
