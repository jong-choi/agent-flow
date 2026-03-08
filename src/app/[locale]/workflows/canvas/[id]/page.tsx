import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import "@xyflow/react/dist/style.css";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowAppWithRemount } from "@/features/canvas/components/flow/flow-app";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import {
  getWorkflowTitleWithAuth,
  getWorkflowWithGraph,
} from "@/features/workflows/server/queries";
import { auth } from "@/lib/auth";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale, withMetadataSuffix } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/canvas/[id]">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });
  const fallbackTitle = withMetadataSuffix(t("meta.canvasTitle"), "CANVAS");

  try {
    const title = await getWorkflowTitleWithAuth(id);
    const normalizedTitle = title?.trim() || t("meta.canvasTitle");

    return {
      title: withMetadataSuffix(normalizedTitle, "CANVAS"),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

export default function CanvasWorkflowPage({
  params,
}: PageProps<"/[locale]/workflows/canvas/[id]">) {
  return (
    <FadeSuspense fallback={<CanvasWorkflowFallback />}>
      <CanvasWorkflowContent paramsPromise={params} />
    </FadeSuspense>
  );
}

async function CanvasWorkflowContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/workflows/canvas/[id]">["params"];
}) {
  const { id, locale: requestedLocale } = await paramsPromise;
  const locale = resolveMetadataLocale(requestedLocale);
  const workflowData = await getWorkflowWithGraph(id);
  const session = await auth();
  const userId = session?.user?.id;

  if (!workflowData || workflowData.workflow.ownerId !== userId) {
    notFound();
  }

  const sidebarNodes = await getSidebarNodesWithOptions(locale);
  const { nodes, edges } = buildFlowGraphFromWorkflow({
    workflowNodes: workflowData.nodes,
    workflowEdges: workflowData.edges,
    sidebarNodes,
  });

  return (
    <DroppableZone>
      <FlowAppWithRemount
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
