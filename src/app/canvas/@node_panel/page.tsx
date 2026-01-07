"use client";

import { type Node, useReactFlow } from "@xyflow/react";
import { type FlowNodeData } from "@/db/query/sidebar-nodes";
import { CanvasNodePanelContainer } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-container";
import { CanvasNodePanelContent } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-content";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export default function NodePanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const { getNode } = useReactFlow<Node<FlowNodeData>>();

  const node = selectedNodeId ? getNode(selectedNodeId) : null;

  if (!node) {
    return null;
  }

  return (
    <CanvasNodePanelContainer>
      <CanvasNodePanelContent node={node} />
    </CanvasNodePanelContainer>
  );
}
