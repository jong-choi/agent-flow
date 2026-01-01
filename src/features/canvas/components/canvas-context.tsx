"use client";

import { useId } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useReactFlow } from "@xyflow/react";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";

export function CanvasContext({ children }: React.PropsWithChildren) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const addNode = useAddNode();
  const { screenToFlowPosition } = useReactFlow();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;

    const data = active.data.current;
    const rect = active.rect.current.translated;

    if (data && rect) {
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      return addNode(data as SidebarNodeData, position);
    }
  };

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}
