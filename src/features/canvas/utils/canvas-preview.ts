import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";
import {
  AUTO_FIT_FILL_RATIO,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from "@/features/canvas/constants/canvas-preview";

const resolveNodeKey = (node: WorkflowNode) => node.nodeId ?? node.id;
const NODE_TYPE_LABEL_STYLE =
  "display:block;font-size:10px;line-height:1;opacity:0.72;font-weight:500;letter-spacing:0.01em;margin:0 0 2px 0;";
const NODE_MAIN_LABEL_STYLE = "display:block;line-height:1.2;margin:0;";

const formatNodeTypeLabel = (nodeType: string) => {
  const withoutNodeSuffix = nodeType.replace(/node$/i, "");
  const normalizedType =
    withoutNodeSuffix.trim().length > 0 ? withoutNodeSuffix : nodeType;
  return normalizedType.toUpperCase();
};

export const escapeMermaidLabel = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "<br/>");

const buildNodeLabel = (node: WorkflowNode, fallbackLabel: string) => {
  const nodeType = escapeMermaidLabel(formatNodeTypeLabel(node.type));
  const mainLabel = escapeMermaidLabel(node.label || fallbackLabel);
  return `<span style='${NODE_TYPE_LABEL_STYLE}'>${nodeType}</span><span style='${NODE_MAIN_LABEL_STYLE}'>${mainLabel}</span>`;
};

export const clampZoom = (zoom: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

export const getNextZoom = (currentZoom: number, deltaY: number) => {
  if (deltaY === 0) {
    return clampZoom(currentZoom);
  }

  const direction = deltaY < 0 ? 1 : -1;
  const nextZoom = currentZoom + direction * ZOOM_STEP;
  return clampZoom(Number(nextZoom.toFixed(2)));
};

type AutoFitZoomParams = {
  currentZoom: number;
  viewportWidth: number;
  viewportHeight: number;
  graphWidth: number;
  graphHeight: number;
};

export const getAutoFitZoom = ({
  currentZoom,
  viewportWidth,
  viewportHeight,
  graphWidth,
  graphHeight,
}: AutoFitZoomParams) => {
  if (
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    graphWidth <= 0 ||
    graphHeight <= 0
  ) {
    return clampZoom(currentZoom);
  }

  const fitZoom =
    Math.min(viewportWidth / graphWidth, viewportHeight / graphHeight) *
    AUTO_FIT_FILL_RATIO;

  if (!Number.isFinite(fitZoom) || fitZoom <= 0) {
    return clampZoom(currentZoom);
  }

  const nextZoom = Math.max(currentZoom, fitZoom);
  return clampZoom(Number(nextZoom.toFixed(2)));
};

export const buildMermaidCode = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
) => {
  const idMap = new Map<string, string>();

  nodes.forEach((node, index) => {
    const mermaidId = `n${index + 1}`;
    idMap.set(resolveNodeKey(node), mermaidId);
  });

  const lines = ["graph LR"];

  for (const node of nodes) {
    const key = idMap.get(resolveNodeKey(node));
    if (!key) {
      continue;
    }

    const label = buildNodeLabel(node, key);
    lines.push(`  ${key}["${label}"]`);
  }

  for (const edge of edges) {
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (!source || !target) {
      continue;
    }

    lines.push(`  ${source} --> ${target}`);
  }

  return lines.join("\n");
};
