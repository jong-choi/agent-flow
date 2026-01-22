import { useReactFlow } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";

export function useCanvasReactFlow() {
  return useReactFlow<FlowCanvasNode>();
}
