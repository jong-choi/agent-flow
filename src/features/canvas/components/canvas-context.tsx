"use client";

import { useId, useState } from "react";
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
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { DraggableItemView } from "@/features/canvas/components/dnd/draggable-item";
import { CANVAS_DROPPABLE_ID } from "@/features/canvas/components/dnd/droppable-zone";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";

export function CanvasContext({ children }: React.PropsWithChildren) {
  const dndId = useId();
  const [activeItem, setActiveItem] = useState<SidebarNodeData | null>(null);

  const setSearchParams = useSetSearchParams();

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    const data = active.data.current;
    const rect = active.rect.current.translated;

    if (over?.id === CANVAS_DROPPABLE_ID && data && rect) {
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      const nodeData = data as SidebarNodeData;
      const node_id = crypto.randomUUID();
      nodeData.id = node_id;
      addNode(data as SidebarNodeData, position);
      setSearchParams({ node_id });
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
