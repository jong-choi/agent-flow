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
      const { id, type, ...data } = item;
      const nextNode: Node<SidebarItemData> = {
        id: `${id}-${Date.now()}`,
        type,
        position,
        data,
      };

      setNodes((current) => [...current, nextNode]);
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    },
    [fitView, setNodes],
  );

  return handleAddNode;
}
