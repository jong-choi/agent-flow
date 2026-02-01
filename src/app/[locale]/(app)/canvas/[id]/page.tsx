import { notFound } from "next/navigation";
import "@xyflow/react/dist/style.css";
import { getSidebarNodesWithOptions } from "@/db/query/sidebar-nodes";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";

export default async function CanvasWorkflowPage({
  params,
}: PageProps<"/[locale]/canvas/[id]">) {
  const { id } = await params;
  const workflowData = await getWorkflowWithGraph(id);

  if (!workflowData) {
    notFound();
  }

  const sidebarNodes = await getSidebarNodesWithOptions();
  const { nodes, edges } = buildFlowGraphFromWorkflow({
    workflowNodes: workflowData.nodes,
    workflowEdges: workflowData.edges,
    sidebarNodes,
  });

  return (
    <DroppableZone>
      <FlowApp
        initialNodes={nodes}
        initialEdges={edges}
        workflow={{
          id: workflowData.workflow.id,
          title: workflowData.workflow.title,
          description: workflowData.workflow.description,
        }}
      />
    </DroppableZone>
  );
}
