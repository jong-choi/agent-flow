import { ReactFlowProvider } from "@xyflow/react";
import { CanvasContainer } from "@/features/canvas/components/canvas-container";
import { FlowApp } from "@/features/canvas/flow/components/flow-app";

export default function FlowPage() {
  return (
    <CanvasContainer>
      <ReactFlowProvider>
        <FlowApp />
      </ReactFlowProvider>
    </CanvasContainer>
  );
}
