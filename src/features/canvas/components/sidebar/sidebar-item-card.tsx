"use client";

import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

type SidebarItemCardProps = {
  item: SidebarNodeData;
};

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const setSelectedInfo = useCanvasStore((s) => s.setSelectedInfo);
  const handleOnClick = () => {
    if (item.information) {
      setSelectedInfo(item.information);
    }
  };

  return <DraggableItem item={item} onClick={handleOnClick} />;
}
