import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

export function CanvasNodePanelContainer({
  defaultSize = 40,
  minSize = 20,
  withHandle = true,
  children,
}: React.PropsWithChildren<{
  defaultSize?: number;
  minSize?: number;
  withHandle?: boolean;
}>) {
  return (
    <>
      <ResizableHandle id="canvas-left-main-handle" withHandle={withHandle} />
      <ResizablePanel
        id="canvas-left-main-bottom"
        defaultSize={defaultSize}
        minSize={minSize}
      >
        {children}
      </ResizablePanel>
    </>
  );
}
