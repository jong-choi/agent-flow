"use client";

import { useId, useState } from "react";
import { flushSync } from "react-dom";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useReactFlow } from "@xyflow/react";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { DraggableItemView } from "@/features/canvas/components/dnd/draggable-item";
import { CANVAS_DROPPABLE_ID } from "@/features/canvas/components/dnd/droppable-zone";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function CanvasContext({ children }: React.PropsWithChildren) {
  const dndId = useId();
  const [activeItem, setActiveItem] = useState<SidebarNodeData | null>(null);

  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const addNode = useAddNode();
  const { screenToFlowPosition } = useReactFlow();

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;

    if (data) {
      setActiveItem(data as SidebarNodeData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const data = active.data.current;
    const rect = active.rect.current.translated;

    if (over?.id === CANVAS_DROPPABLE_ID && data && rect) {
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      const nodeData = data as SidebarNodeData;
      const nodeId = crypto.randomUUID();
      nodeData.id = nodeId;

      // addNode를 setSelectedNodeId보다 먼저 실행
      flushSync(() => {
        addNode(data as SidebarNodeData, position);
      });
      setSelectedNodeId(nodeId);
    }

    setActiveItem(null);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem ? <DraggableItemView item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
