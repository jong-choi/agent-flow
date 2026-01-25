import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";
import { MermaidRenderer } from "@/features/canvas/components/flow/cavas-preview/mermaid-renderer";

type CanvasSsrPreviewProps = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export function CanvasPreview({ nodes, edges }: CanvasSsrPreviewProps) {
  const chart = buildMermaidCode(nodes, edges);
  return (
    <div
      className="flex items-center justify-center overflow-auto"
      style={{ height: 200 }}
    >
      <MermaidRenderer chart={chart} />
    </div>
  );
}

const escapeMermaidLabel = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "<br/>");

const resolveNodeKey = (node: WorkflowNode) => node.nodeId ?? node.id;

const buildMermaidCode = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
  const idMap = new Map<string, string>();

  nodes.forEach((node, index) => {
    idMap.set(resolveNodeKey(node), `n${index + 1}`);
  });

  const lines = ["graph LR"];

  for (const node of nodes) {
    const key = idMap.get(resolveNodeKey(node));
    if (!key) continue;

    const label = escapeMermaidLabel(node.label || key);
    lines.push(`  ${key}["${label}"]`);
  }

  for (const edge of edges) {
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (!source || !target) continue;

    lines.push(`  ${source} --> ${target}`);
  }

  return lines.join("\n");
};
