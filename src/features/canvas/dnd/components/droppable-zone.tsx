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
        "relative flex h-full min-h-[80vh] w-full items-center justify-center rounded-2xl border-2 border-dashed",
        isOver ? "border-primary bg-muted" : "border-border bg-muted/50",
      )}
    >
      {children}
    </div>
  );
}
