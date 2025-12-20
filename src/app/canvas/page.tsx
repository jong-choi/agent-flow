"use client";

import "@xyflow/react/dist/style.css";
import { CanvasContext } from "@/features/canvas/components/canvas-context";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { SidebarItemCard } from "@/features/canvas/components/sidebar-item-card";
import { CanvasContainer } from "@/features/canvas/components/ui/canvas-container";
import { CanvasSidebar } from "@/features/canvas/components/ui/canvas-sidebar";
import { SIDEBAR_ITEMS } from "@/features/canvas/constants/flow";

export default function CanvasPage() {
  return (
    <CanvasContext>
      <CanvasSidebar>
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarItemCard item={item} key={item.id} />
        ))}
      </CanvasSidebar>
      <CanvasContainer>
        <DroppableZone>
          <div className="h-[70vh] overflow-hidden rounded-xl bg-card shadow-sm">
            <FlowApp />
          </div>
        </DroppableZone>
      </CanvasContainer>
    </CanvasContext>
  );
}
