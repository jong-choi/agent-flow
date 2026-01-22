import { useCallback } from "react";
import { type Node, type XYPosition, useReactFlow } from "@xyflow/react";
import {
  type FlowNodeData,
  type SidebarNodeData,
} from "@/db/types/sidebar-nodes";

export function useAddNode() {
  const { fitView, setNodes, getNodes } = useReactFlow<Node<FlowNodeData>>();

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

      setNodes(newNodes);
      fitView({ padding: 0.2, duration: 400 });
    },
    [fitView, getNodes, setNodes],
  );

  return handleAddNode;
}
