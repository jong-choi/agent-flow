import { useCallback } from "react";
import type { getPresetGraphForCanvasAction } from "@/db/query/presets";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import {
  buildImportedPresetGraph,
  computePresetImportOffset,
} from "@/features/canvas/utils/preset-import-graph";

type PresetGraphForCanvas = Awaited<
  ReturnType<typeof getPresetGraphForCanvasAction>
>;

export const useAppendPresetGraphToCanvas = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useCanvasReactFlow();

  return useCallback(
    (graph: PresetGraphForCanvas) => {
      const existingNodes = getNodes();
      const existingEdges = getEdges();

      const instanceId = crypto.randomUUID();
      const offset = computePresetImportOffset({
        existingNodes,
        presetNodes: graph.nodes,
      });

      const imported = buildImportedPresetGraph({
        presetId: graph.preset.id,
        instanceId,
        nodes: graph.nodes,
        edges: graph.edges,
        offset,
      });

      setNodes([...existingNodes, ...imported.nodes]);
      setEdges([...existingEdges, ...imported.edges]);

      return { instanceId };
    },
    [getEdges, getNodes, setEdges, setNodes],
  );
};
