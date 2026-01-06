import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CanvasContainer } from "@/features/canvas/components/canvas-container";
import { CanvasContext } from "@/features/canvas/components/canvas-context";
import { CanvasChatPanelContainer } from "@/features/canvas/components/chat/canvas-chat-panel/canvas-chat-panel-container";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { CanvasNodePanelContainer } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-container";
import { CanvasNodePanelContent } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-content";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { SidebarContainer } from "@/features/canvas/components/sidebar/sidebar-container";
import { SidebarContent } from "@/features/canvas/components/sidebar/sidebar-content";
import { SidebarInfoContent } from "@/features/canvas/components/sidebar/sidebar-info-content";

export default function CanvasPage() {
  return (
    <CanvasContext>
      <div className="flex h-full min-h-0 flex-1 bg-muted/30 p-4">
        {/* 좌측 영역 */}
        <div className="flex h-full w-72 flex-col gap-2">
          <SidebarContainer
            className="min-h-0 flex-1"
            title="사이드바"
            description="draggable 객체의 목록"
          >
            <SidebarContent />
          </SidebarContainer>
          <Card className="h-1/4">
            <SidebarInfoContent />
          </Card>
        </div>
        <CanvasContainer>
          {/* 중앙 영역 */}
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={60} minSize={40}>
                  <DroppableZone>
                    <FlowApp />
                  </DroppableZone>
                </ResizablePanel>
                <CanvasNodePanelContainer>
                  <CanvasNodePanelContent />
                </CanvasNodePanelContainer>
              </ResizablePanelGroup>
            </ResizablePanel>
            {/* 우측 영역 */}
            <CanvasChatPanelContainer>
              <CanvasNodePanelContent />
            </CanvasChatPanelContainer>
          </ResizablePanelGroup>
        </CanvasContainer>
      </div>
    </CanvasContext>
  );
}
