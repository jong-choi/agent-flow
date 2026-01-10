"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";

type DraggableItemProps = {
  item: SidebarNodeData;
  onClick: React.MouseEventHandler<HTMLDivElement>;
};

export function DraggableItemView({ item }: { item: SidebarNodeData }) {
  return (
    <Card className="w-full cursor-grabbing p-2 px-0">
      <CardHeader>
        <CardTitle>{item.label}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function DraggableItem({ item, onClick }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = {
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      aria-describedby={"draggable item"}
    >
      <DraggableItemView item={item} />
    </div>
  );
}
