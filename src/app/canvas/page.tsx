import "@xyflow/react/dist/style.css";
import { CanvasContext } from "@/features/canvas/components/canvas-context";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { SidebarContainer } from "@/features/canvas/components/sidebar/sidebar-container";
import { SidebarContent } from "@/features/canvas/components/sidebar/sidebar-content";
import { CanvasContainer } from "@/features/canvas/components/ui/canvas-container";

export default function CanvasPage() {
  return (
    <CanvasContext>
      <SidebarContainer>
        <SidebarContent />
      </SidebarContainer>
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
