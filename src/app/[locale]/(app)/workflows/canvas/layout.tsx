import { ReactFlowProvider } from "@xyflow/react";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
    <div className="flex flex-1 bg-muted/50 p-2">
      <ReactFlowProvider>
        <CanvasStoreProvider>
          <CanvasContext>
            {/* 좌측 영역 */}
            <div className="h-full w-72">
              <SidebarContainer
                className="h-full w-full"
                footer={<SidebarInfoContent />}
              >
                <SidebarContent />
              </SidebarContainer>
            </div>
            <ResizablePanelGroup
              id="canvas-root-h"
              direction="horizontal"
              className="h-full px-1"
            >
              {/* 왼쪽 패널 */}
              <ResizablePanel
                id="canvas-left"
                defaultSize={80}
                minSize={30}
                order={1}
              >
                <ResizablePanelGroup
                  id="canvas-left-main"
                  direction="vertical"
                  className="h-full"
                >
                  {children}
                </ResizablePanelGroup>
              </ResizablePanel>
              {/* 오른쪽 패널 */}
              {nodePanel}
            </ResizablePanelGroup>
            {chatPanel}
          </CanvasContext>
        </CanvasStoreProvider>
      </ReactFlowProvider>
    </div>
  );
}
