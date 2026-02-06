import { notFound } from "next/navigation";
import "@xyflow/react/dist/style.css";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { getWorkflowWithGraph } from "@/features/workflows/server/queries";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { auth } from "@/lib/auth";

export default async function CanvasWorkflowPage({
  params,
}: PageProps<"/[locale]/workflows/canvas/[id]">) {
  const { id } = await params;
  const workflowData = await getWorkflowWithGraph(id);
  const session = await auth();
  const userId = session?.user?.id;

  if (!workflowData || workflowData.workflow.ownerId !== userId) {
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
