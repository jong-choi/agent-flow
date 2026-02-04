import { type Edge } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { buildPresetNodeId } from "@/features/canvas/utils/preset-import";

const DEFAULT_PRESET_IMPORT_GAP_X = 320;

type Positioned = {
  position: { x: number; y: number };
};

export type PresetImportOffset = { x: number; y: number };

const resolveMinX = (nodes: Positioned[]): number => {
  if (nodes.length === 0) return 0;
  return Math.min(...nodes.map((node) => node.position.x));
};

const resolveMinY = (nodes: Positioned[]): number => {
  if (nodes.length === 0) return 0;
  return Math.min(...nodes.map((node) => node.position.y));
};

const resolveMaxX = (nodes: Positioned[]): number => {
  if (nodes.length === 0) return 0;
  return Math.max(...nodes.map((node) => node.position.x));
};

export const computePresetImportOffset = ({
  existingNodes,
  presetNodes,
  gapX = DEFAULT_PRESET_IMPORT_GAP_X,
}: {
  existingNodes: Positioned[];
  presetNodes: Positioned[];
  gapX?: number;
}): PresetImportOffset => {
  if (presetNodes.length === 0) {
    return { x: 0, y: 0 };
  }

  const presetMinX = resolveMinX(presetNodes);
  const presetMinY = resolveMinY(presetNodes);

  if (existingNodes.length === 0) {
    return { x: -presetMinX, y: -presetMinY };
  }

  const currentMaxX = resolveMaxX(existingNodes);
  const currentMinY = resolveMinY(existingNodes);

  return {
    x: currentMaxX - presetMinX + gapX,
    y: currentMinY - presetMinY,
  };
};

export type ImportedPresetGraph = {
  nodes: FlowCanvasNode[];
  edges: Edge[];
};

export const buildImportedPresetGraph = ({
  presetId,
  instanceId,
  nodes,
  edges,
  offset,
  createEdgeId = () => crypto.randomUUID(),
}: {
  presetId: string;
  instanceId: string;
  nodes: FlowCanvasNode[];
  edges: Edge[];
  offset: PresetImportOffset;
  createEdgeId?: () => string;
}): ImportedPresetGraph => {
  const nodeIdMap = new Map<string, string>();

  const importedNodes = nodes.map((node) => {
    const nextNodeId = buildPresetNodeId({
      presetId,
      instanceId,
      originalNodeId: node.id,
    });

    nodeIdMap.set(node.id, nextNodeId);

    return {
      ...node,
      id: nextNodeId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    };
  });

  const importedEdges = edges
    .filter((edge) => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: createEdgeId(),
      source: nodeIdMap.get(edge.source)!,
      target: nodeIdMap.get(edge.target)!,
    }));

  return { nodes: importedNodes, edges: importedEdges };
};
