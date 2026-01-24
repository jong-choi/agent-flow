import { type Edge } from "@xyflow/react";
import {
  type FlowCanvasNode,
  type SidebarNodeData,
} from "@/db/types/sidebar-nodes";
import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";

type BuildFlowGraphParams = {
  workflowNodes: WorkflowNode[];
  workflowEdges: WorkflowEdge[];
  sidebarNodes: SidebarNodeData[];
};

export const buildFlowGraphFromWorkflow = ({
  workflowNodes,
  workflowEdges,
  sidebarNodes,
}: BuildFlowGraphParams): { nodes: FlowCanvasNode[]; edges: Edge[] } => {
  const sidebarNodeMap = new Map(
    sidebarNodes.map((node) => [node.type, node]),
  );

  const nodes = workflowNodes.map((node) => {
    const baseNode = sidebarNodeMap.get(node.type);
    const baseContent = baseNode?.content ? { ...baseNode.content } : null;
    const baseHandle = baseNode?.handle ? { ...baseNode.handle } : null;

    const flowNodeId = node.nodeId ?? node.id;

    const content = baseContent ? { ...baseContent } : null;

    if (content) {
      content.value = node.value ?? null;
    }

    const handle = baseHandle
      ? {
          ...baseHandle,
          targetCount: node.targetCount ?? null,
          sourceCount: node.sourceCount ?? null,
        }
      : null;

    return {
      id: flowNodeId,
      type: node.type,
      position: { x: node.posX, y: node.posY },
      data: {
        label: node.label ?? baseNode?.label ?? "",
        description: node.description ?? baseNode?.description ?? "",
        content,
        handle,
        information: baseNode?.information ?? null,
      },
    };
  });

  const edges = workflowEdges.map((edge) => ({
    id: edge.edgeId ?? edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));

  return { nodes, edges };
};
