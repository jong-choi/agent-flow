import { ReactFlowProvider } from "@xyflow/react";
import { CanvasStoreProvider } from "@/features/canvas/store/providers/canvas-store-provider";

type CanvasLayout = {
  children: React.ReactNode;
};

export default function CanvasLayout({ children }: CanvasLayout) {
  return (
    <ReactFlowProvider>
      <CanvasStoreProvider>{children} </CanvasStoreProvider>
    </ReactFlowProvider>
  );
}
