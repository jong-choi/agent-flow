"use client";

import { useId } from "react";
import { DndContext } from "@dnd-kit/core";
import { CanvasContainer } from "@/features/canvas/components/canvas-container";
import { CanvasContentContainer } from "@/features/canvas/components/canvas-contant-container";
import { CanvasSidebar } from "@/features/canvas/components/canvas-sidebar";
import {
  DraggableItem,
  SidebarItem,
} from "@/features/canvas/dnd/components/draggable-item";
import { DroppableZone } from "@/features/canvas/dnd/components/droppable-zone";
import { handleDragEnd } from "@/features/canvas/dnd/utils/handlers";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "card-1", label: "카드 1", description: "카드 1 설명" },
  { id: "card-2", label: "카드 2", description: "카드 2 설명" },
  { id: "card-3", label: "카드 3", description: "카드 3 설명" },
];

export default function CanvasPage() {
  const dndId = useId();

  return (
    <CanvasContainer>
      <DndContext id={dndId} onDragEnd={handleDragEnd}>
        <CanvasSidebar>
          {SIDEBAR_ITEMS.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </CanvasSidebar>
        <CanvasContentContainer>
          <DroppableZone>
            <div className="flex flex-col items-center gap-4 text-center text-slate-500">
              <span className="text-sm">Droppable 영역</span>
            </div>
          </DroppableZone>
        </CanvasContentContainer>
      </DndContext>
    </CanvasContainer>
  );
}
