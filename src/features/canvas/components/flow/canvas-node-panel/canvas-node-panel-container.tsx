import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

export function CanvasNodePanelContainer({
  defaultSize = 30,
  minSize = 20,
  withHandle = true,
  order = 2,
  children,
}: React.PropsWithChildren<{
  defaultSize?: number;
  minSize?: number;
  withHandle?: boolean;
  order?: number;
}>) {
  return (
    <>
      <ResizableHandle id="canvas-left-main-handle" withHandle={withHandle} />
      <ResizablePanel
        id="canvas-left-main-bottom"
        defaultSize={defaultSize}
        minSize={minSize}
        order={order}
      >
        {children}
      </ResizablePanel>
    </>
  );
}
