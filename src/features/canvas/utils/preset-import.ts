type ParsedPresetNodeId = {
  presetId: string;
  instanceId: string;
  originalNodeId: string;
};

const PRESET_NODE_ID_PREFIX = "preset";
const PRESET_NODE_ID_SEPARATOR = "_";

export const buildPresetNodeId = ({
  presetId,
  instanceId,
  originalNodeId,
}: ParsedPresetNodeId) =>
  `${PRESET_NODE_ID_PREFIX}${PRESET_NODE_ID_SEPARATOR}${presetId}${PRESET_NODE_ID_SEPARATOR}${instanceId}${PRESET_NODE_ID_SEPARATOR}${originalNodeId}`;

export const parsePresetNodeId = (
  nodeId: string,
): ParsedPresetNodeId | null => {
  const parts = nodeId.split(PRESET_NODE_ID_SEPARATOR);
  if (parts.length < 4) {
    return null;
  }

  const [prefix, presetId, instanceId, ...rest] = parts;
  if (prefix !== PRESET_NODE_ID_PREFIX) {
    return null;
  }

  const originalNodeId = rest.join(PRESET_NODE_ID_SEPARATOR);
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
