import "@xyflow/react/dist/style.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasContainer } from "@/features/canvas/components/canvas-container";
import { CanvasContext } from "@/features/canvas/components/canvas-context";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { SidebarContainer } from "@/features/canvas/components/sidebar/sidebar-container";
import { SidebarContent } from "@/features/canvas/components/sidebar/sidebar-content";
import { SidebarInfoContent } from "@/features/canvas/components/sidebar/sidebar-info-content";

export default function CanvasPage() {
  return (
    <CanvasContext>
      <div className="flex min-h-0 grow overflow-hidden bg-muted/30 p-4">
        <div className="flex min-w-72 flex-col gap-2">
          <SidebarContainer>
            <SidebarContent />
          </SidebarContainer>
          <SidebarInfoContent />
        </div>
        <CanvasContainer>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={65} minSize={40}>
              <DroppableZone>
                <FlowApp />
              </DroppableZone>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={20}>
              <section className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Three
                    </p>
                    <h2 className="text-lg font-semibold">Chat</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    3 online
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-sm">
                  <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2">
                    Need eyes on the new onboarding flow.
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
                    On it. Dropping notes in 10 min.
                  </div>
                  <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2">
                    I can cover analytics after lunch.
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <span className="flex-1">
                      Write a message to the team...
                    </span>
                    <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                      Send
                    </span>
                  </div>
                </div>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CanvasContainer>
      </div>
    </CanvasContext>
  );
}
