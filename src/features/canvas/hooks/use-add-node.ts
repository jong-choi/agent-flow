import { useCallback } from "react";
import { type Node, type XYPosition, useReactFlow } from "@xyflow/react";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";
import {
  type SidebarNode,
  type SidebarNodeData,
} from "@/features/canvas/schema/sidebar-nodes";

export function useAddNode() {
  const { fitView, setNodes, getNodes } = useReactFlow();
  const checkValidGraph = useCheckValidGraph();

  const handleAddNode = useCallback(
    (item: SidebarNode, position: XYPosition) => {
      const { id, type, ...data } = item;
      const nextNode: Node<SidebarNodeData> = {
        id: `${id}-${Date.now()}`,
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
