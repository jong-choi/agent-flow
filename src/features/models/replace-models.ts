import type { FlowCanvasNode } from "@/db/types/sidebar-nodes";

export function replaceModelReferences(
  nodes: FlowCanvasNode[],
  source: string,
  target: string,
  options: { id: string; value: string; legacyValue?: string }[],
) {
  const selected = options.find(
    (o) => o.id === source || o.value === source || o.legacyValue === source,
  );
  const refs = new Set(
    [source, selected?.id, selected?.value, selected?.legacyValue].filter(
      Boolean,
    ),
  );
  return nodes.map((node) =>
    node.type === "chatNode" &&
    node.data.content &&
    refs.has(node.data.content.value ?? "")
      ? {
          ...node,
          data: {
            ...node.data,
            content: { ...node.data.content, value: target },
          },
        }
      : node,
  );
}
