"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export const CANVAS_DROPPABLE_ID = "canvas-dropzone";

export function DroppableZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: CANVAS_DROPPABLE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full border bg-background",
        isOver && "border-dashed border-primary/50",
      )}
    >
      {children}
    </div>
  );
}
