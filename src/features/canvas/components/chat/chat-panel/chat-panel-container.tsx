import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

export function ChatPanelContainer({
  defaultSize = 50,
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
      <ResizableHandle id="canvas-right-handle" withHandle={withHandle} />
      <ResizablePanel
        id="canvas-right-main"
        defaultSize={defaultSize}
        minSize={minSize}
        order={order}
      >
        {children}
      </ResizablePanel>
    </>
  );
}
