"use client";

import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

type SidebarItemCardProps = {
  item: SidebarNodeData;
};

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const setSelectedInfo = useCanvasStore((s) => s.setSelectedInfo);
  const handleOnMouseDown = () => {
    if (item.information) {
      setSelectedInfo(item.information);
    }
  };

  return <DraggableItem item={item} onMouseDown={handleOnMouseDown} />;
}
