"use client";

import { useSearchParams } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { CanvasNodePanelContainer } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-container";
import { CanvasNodePanelContent } from "@/features/canvas/components/flow/canvas-node-panel/canvas-node-panel-content";

export default function NodePanel() {
  const searchParams = useSearchParams();
  const nodeId = searchParams.get("node_id") ?? undefined;
  const { getNode } = useReactFlow();

  const node = nodeId ? getNode(nodeId) : null;

  if (!node) {
    return null;
  }

  return (
    <CanvasNodePanelContainer>
      <CanvasNodePanelContent node={node} />
    </CanvasNodePanelContainer>
  );
}
