import { parsePresetNodeId } from "@/features/canvas/utils/preset-import";

export type PresetGroupBox = {
  key: string;
  presetId: string;
  instanceId: string;
  nodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
};

type MeasuredNode = {
  id: string;
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  measured?: { width?: number | null; height?: number | null } | null;
};

export type BuildPresetGroupBoxesOptions = {
  padding?: number;
  nodeWidthFallback?: number;
  nodeHeightFallback?: number;
};

const DEFAULT_NODE_WIDTH_FALLBACK = 192;
const DEFAULT_NODE_HEIGHT_FALLBACK = 120;
const DEFAULT_GROUP_PADDING = 24;

const resolveNodeSize = (
  node: MeasuredNode,
  {
    nodeWidthFallback,
    nodeHeightFallback,
  }: Required<
    Pick<
      BuildPresetGroupBoxesOptions,
      "nodeWidthFallback" | "nodeHeightFallback"
    >
  >,
) => {
  const width = node.measured?.width ?? node.width ?? nodeWidthFallback;
  const height = node.measured?.height ?? node.height ?? nodeHeightFallback;
  return { width, height };
};

export const buildPresetGroupBoxes = (
  nodes: MeasuredNode[],
  {
    padding = DEFAULT_GROUP_PADDING,
    nodeWidthFallback = DEFAULT_NODE_WIDTH_FALLBACK,
    nodeHeightFallback = DEFAULT_NODE_HEIGHT_FALLBACK,
  }: BuildPresetGroupBoxesOptions = {},
): PresetGroupBox[] => {
  const groups = new Map<
    string,
    Omit<PresetGroupBox, "x" | "y" | "width" | "height"> & {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    }
  >();

  for (const node of nodes) {
    const parsed = parsePresetNodeId(node.id);
    if (!parsed) {
      continue;
    }

    const key = `${parsed.presetId}:${parsed.instanceId}`;
    const { width, height } = resolveNodeSize(node, {
      nodeWidthFallback,
      nodeHeightFallback,
    });

    const minX = node.position.x;
    const minY = node.position.y;
    const maxX = node.position.x + width;
    const maxY = node.position.y + height;

    const existing = groups.get(key);
    if (existing) {
      existing.nodeIds.push(node.id);
      existing.minX = Math.min(existing.minX, minX);
      existing.minY = Math.min(existing.minY, minY);
      existing.maxX = Math.max(existing.maxX, maxX);
      existing.maxY = Math.max(existing.maxY, maxY);
      continue;
    }

    groups.set(key, {
      key,
      presetId: parsed.presetId,
      instanceId: parsed.instanceId,
      nodeIds: [node.id],
      minX,
      minY,
      maxX,
      maxY,
    });
  }

  return Array.from(groups.values()).map((group) => ({
    key: group.key,
    presetId: group.presetId,
    instanceId: group.instanceId,
    nodeIds: group.nodeIds,
    x: group.minX - padding,
    y: group.minY - padding,
    width: group.maxX - group.minX + padding * 2,
    height: group.maxY - group.minY + padding * 2,
  }));
};
