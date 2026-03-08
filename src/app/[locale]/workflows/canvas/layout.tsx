import { ReactFlowProvider } from "@xyflow/react";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
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
  params,
  chat_panel: chatPanel,
  node_panel: nodePanel,
}: LayoutProps<"/[locale]/workflows/canvas">) {
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
                <FadeSuspense fallback={<CanvasSidebarFallback />}>
                  <SidebarContent params={params} />
                </FadeSuspense>
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

function CanvasSidebarFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="rounded-md border bg-muted/30 p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
