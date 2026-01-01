"use client";

import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";

type SidebarItemCardProps = {
  item: SidebarNodeData;
};

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const addNode = useAddNode();

  const handleOnClick = () => {
    addNode(item, {
      x: 180 + Math.floor(Math.random() * 50),
      y: 140 - 100 + Math.floor(Math.random() * 20),
    });
  };

  return <DraggableItem item={item} onClick={handleOnClick} />;
}
