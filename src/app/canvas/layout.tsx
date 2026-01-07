import { Suspense } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CanvasContainer } from "@/features/canvas/components/canvas-container";
import { CanvasContext } from "@/features/canvas/components/canvas-context";
import { SidebarContainer } from "@/features/canvas/components/sidebar/sidebar-container";
import { SidebarContent } from "@/features/canvas/components/sidebar/sidebar-content";
import { SidebarInfoContent } from "@/features/canvas/components/sidebar/sidebar-info-content";
import { CanvasStoreProvider } from "@/features/canvas/store/canvas-store";

type CanvasLayout = {
  children: React.ReactNode;
  chat_panel: React.ReactNode;
  node_panel: React.ReactNode;
};

export default function CanvasLayout({
  children,
  chat_panel: chatPanel,
  node_panel: nodePanel,
}: CanvasLayout) {
  return (
    <ReactFlowProvider>
      <CanvasStoreProvider>
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
              <ResizablePanelGroup
                id="canvas-root-h"
                direction="horizontal"
                className="h-full"
              >
                <ResizablePanel
                  id="canvas-left"
                  defaultSize={50}
                  minSize={30}
                  order={1}
                >
                  <ResizablePanelGroup
                    id="canvas-left-main"
                    direction="vertical"
                    className="h-full"
                  >
                    {/* 캔버스 */}
                    <ResizablePanel
                      id="canvas-left-main-top"
                      defaultSize={60}
                      minSize={40}
                      order={1}
                    >
                      {children}
                    </ResizablePanel>
                    {/* 노드 수정 */}
                    <Suspense>{nodePanel}</Suspense>
                  </ResizablePanelGroup>
                </ResizablePanel>
                {/* 우측 영역 */}
                <Suspense>{chatPanel}</Suspense>
              </ResizablePanelGroup>
            </CanvasContainer>
          </div>
        </CanvasContext>
      </CanvasStoreProvider>
    </ReactFlowProvider>
  );
}
