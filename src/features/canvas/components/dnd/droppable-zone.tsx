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
        "h-full border-2 border-dashed",
        isOver ? "border-primary bg-muted/50" : "border-border bg-card",
      )}
    >
      {children}
    </div>
  );
}
