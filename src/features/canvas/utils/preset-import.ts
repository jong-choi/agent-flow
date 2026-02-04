type ParsedPresetNodeId = {
  presetId: string;
  instanceId: string;
  originalNodeId: string;
};

const PRESET_NODE_ID_PREFIX = "preset";

export const buildPresetNodeId = ({
  presetId,
  instanceId,
  originalNodeId,
}: ParsedPresetNodeId) =>
  `${PRESET_NODE_ID_PREFIX}-${presetId}-${instanceId}-${originalNodeId}`;

export const parsePresetNodeId = (
  nodeId: string,
): ParsedPresetNodeId | null => {
  const parts = nodeId.split("-");
  if (parts.length < 4) {
    return null;
  }

  const [prefix, presetId, instanceId, ...rest] = parts;
  if (prefix !== PRESET_NODE_ID_PREFIX) {
    return null;
  }

  const originalNodeId = rest.join("-");
  if (!presetId || !instanceId || !originalNodeId) {
    return null;
  }

  return { presetId, instanceId, originalNodeId };
};

export const extractPresetIdsFromNodes = (
  nodes: Array<{ id: string }>,
): string[] => {
  const ids = new Set<string>();
  for (const node of nodes) {
    const parsed = parsePresetNodeId(node.id);
    if (parsed) {
      ids.add(parsed.presetId);
    }
  }

  return Array.from(ids);
};
