"use client";

import { CanvasNodePanelContainer } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-container";
import { CanvasNodePanelContent } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-content";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export default function NodePanel() {
  const { getNode } = useCanvasReactFlow();
  const updatedAt = useCanvasStore((s) => s.updatedAt);

  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  if (!selectedNodeId) {
    return null;
  }

  const node = getNode(selectedNodeId);
  if (!node) {
    return null;
  }

  return (
    <CanvasNodePanelContainer defaultSize={20} minSize={10}>
      <CanvasNodePanelContent selectedNodeId={selectedNodeId} key={updatedAt} />
    </CanvasNodePanelContainer>
  );
}
