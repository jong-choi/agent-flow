"use client";

import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

type SidebarItemCardProps = {
  item: SidebarNodeData;
};

type SidebarInfo = Omit<NonNullable<SidebarNodeData["information"]>, "id">;

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const setSelectedInfo = useCanvasStore((s) => s.setSelectedInfo);

  const handleOnMouseDown = () => {
    if (item.information) {
      setSelectedInfo({
        nodeId: item.information.nodeId,
        title: item.information.title,
        summary: item.information.summary,
        description: item.information.description,
        guides: item.information.guides,
      });
      return;
    }

    const fallbackInformation: SidebarInfo = {
      nodeId: item.id,
      title: item.label,
      summary: item.description,
      description: item.description,
      guides: [],
    };
    setSelectedInfo(fallbackInformation);
  };

  return <DraggableItem item={item} onMouseDown={handleOnMouseDown} />;
}
