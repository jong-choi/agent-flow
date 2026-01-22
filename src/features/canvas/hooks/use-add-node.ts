import { useCallback } from "react";
import { type XYPosition } from "@xyflow/react";
import {
  type FlowCanvasNode,
  type SidebarNodeData,
} from "@/db/types/sidebar-nodes";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";

export function useAddNode() {
  const { fitView, setNodes, getNodes } = useCanvasReactFlow();

  const handleAddNode = useCallback(
    (item: SidebarNodeData, position: XYPosition) => {
      const { id, type, ...data } = item;
      const nextNode: FlowCanvasNode = {
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
