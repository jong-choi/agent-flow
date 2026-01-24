"use client";

import { CanvasNodePanelContainer } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-container";
import { CanvasNodePanelContent } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-content";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export default function NodePanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const { getNode } = useCanvasReactFlow();

  const node = selectedNodeId ? getNode(selectedNodeId) : null;

  if (!node) {
    return null;
  }

  return (
    <CanvasNodePanelContainer defaultSize={20} minSize={10}>
      <CanvasNodePanelContent node={node} />
    </CanvasNodePanelContainer>
  );
}
