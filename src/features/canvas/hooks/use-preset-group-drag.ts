import { useCallback } from "react";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { type PresetGroupBox } from "@/features/canvas/utils/preset-groups";

export const usePresetGroupDrag = () => {
  const { getNodes, setNodes, screenToFlowPosition } = useCanvasReactFlow();

  return useCallback(
    (group: PresetGroupBox, event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const start = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeIdSet = new Set(group.nodeIds);
      const initialPositions = new Map<string, { x: number; y: number }>();

      for (const node of getNodes()) {
        if (!nodeIdSet.has(node.id)) {
          continue;
        }

        initialPositions.set(node.id, {
          x: node.position.x,
          y: node.position.y,
        });
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const current = screenToFlowPosition({
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        });

        const dx = current.x - start.x;
        const dy = current.y - start.y;

        setNodes((nodes) =>
          nodes.map((node) => {
            const initial = initialPositions.get(node.id);
            if (!initial) {
              return node;
            }

            return {
              ...node,
              position: {
                x: initial.x + dx,
                y: initial.y + dy,
              },
            };
          }),
        );
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", handlePointerMove);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", cleanup, { once: true });
      window.addEventListener("pointercancel", cleanup, { once: true });
    },
    [getNodes, screenToFlowPosition, setNodes],
  );
};
