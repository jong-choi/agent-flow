import { Suspense } from "react";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import "@xyflow/react/dist/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import {
  getWorkflowTitleWithAuth,
  getWorkflowWithGraph,
} from "@/features/workflows/server/queries";
import { auth } from "@/lib/auth";
import {
  resolveMetadataLocale,
  resolveMetadataTitle,
  withMetadataSuffix,
} from "@/lib/metadata";

const canvasFallbackTitles = {
  ko: "캔버스",
  en: "Canvas",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/canvas/[id]">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const fallbackTitle = withMetadataSuffix(
    canvasFallbackTitles[locale],
    "CANVAS",
  );

  try {
    const title = await getWorkflowTitleWithAuth(id);

    return {
      title: withMetadataSuffix(
        resolveMetadataTitle({
          title,
          locale,
          localizedFallbacks: canvasFallbackTitles,
        }),
        "CANVAS",
      ),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

export default function CanvasWorkflowPage({
  params,
}: PageProps<"/[locale]/workflows/canvas/[id]">) {
  return (
    <Suspense fallback={<CanvasWorkflowFallback />}>
      <CanvasWorkflowContent paramsPromise={params} />
    </Suspense>
  );
}

async function CanvasWorkflowContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/workflows/canvas/[id]">["params"];
}) {
  const { id } = await paramsPromise;
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

function CanvasWorkflowFallback() {
  return (
    <div className="flex h-full w-full flex-1 p-2">
      <div className="h-full w-full rounded-lg border bg-background p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-[620px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
