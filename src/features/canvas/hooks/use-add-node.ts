import { useCallback } from "react";
import { type Node, type XYPosition, useReactFlow } from "@xyflow/react";
import {
  type FlowNodeData,
  type SidebarNodeData,
} from "@/db/query/sidebar-nodes";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";

export function useAddNode() {
  const { fitView, setNodes, getNodes } = useReactFlow();
  const checkValidGraph = useCheckValidGraph();

  const handleAddNode = useCallback(
    (item: SidebarNodeData, position: XYPosition) => {
      const { id, type, ...data } = item;
      const nextNode: Node<FlowNodeData> = {
        id,
        type,
        position,
        data,
      };

      const newNodes = [...getNodes(), nextNode];
      checkValidGraph({ nodes: newNodes });
      setNodes(newNodes);

      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    },
    [checkValidGraph, fitView, getNodes, setNodes],
  );

  return handleAddNode;
}
