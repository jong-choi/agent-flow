import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import "@xyflow/react/dist/style.css";
import { db } from "@/db/client";
import { getSidebarNodesWithOptions } from "@/db/query/sidebar-nodes";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { users } from "@/db/schema";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { auth } from "@/lib/auth";

export default async function CanvasWorkflowPage({
  params,
}: PageProps<"/canvas/[id]">) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const { id } = await params;
  const workflowData = await getWorkflowWithGraph(id, user.id);

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
