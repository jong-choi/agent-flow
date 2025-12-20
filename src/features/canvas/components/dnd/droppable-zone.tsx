import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function DroppableZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "canvas-dropzone",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border-2 border-dashed",
        isOver ? "border-primary bg-muted" : "border-border bg-muted/50",
      )}
    >
      {children}
    </div>
  );
}
