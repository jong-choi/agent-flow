"use client";

import { useDraggable } from "@dnd-kit/core";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { Icons, isIconName } from "@/features/canvas/constants/icons";
import { cn } from "@/lib/utils";

type DraggableItemProps = {
  item: SidebarNodeData;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
};

export function DraggableItemView({ item }: { item: SidebarNodeData }) {
  const IconComponent = isIconName(item.icon) ? Icons[item.icon] : Icons.Circle;

  return (
    <div className="group flex w-full cursor-grab items-center rounded-lg border border-transparent p-2 transition-all hover:bg-accent hover:text-accent-foreground">
      <div
        className={cn(
          "mr-3 flex size-8 shrink-0 items-center justify-center rounded-md text-white shadow-sm",
          item.backgroundColor,
        )}
      >
        <IconComponent className="size-4" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-sm leading-none font-medium">{item.label}</span>
        <span className="mt-1 line-clamp-1 text-xs text-muted-foreground group-hover:text-accent-foreground/80">
          {item.description}
        </span>
      </div>
    </div>
  );
}

export function DraggableItem({ item, onMouseDown }: DraggableItemProps) {
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
      onMouseDown={onMouseDown}
      aria-describedby={"draggable item"}
    >
      <DraggableItemView item={item} />
    </div>
  );
}
