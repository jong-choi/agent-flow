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
      <ResizableHandle withHandle={withHandle} />
      <ResizablePanel defaultSize={defaultSize} minSize={minSize}>
        {children}
      </ResizablePanel>
    </>
  );
}
