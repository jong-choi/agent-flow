import { Suspense } from "react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronLeft } from "lucide-react";
import "@xyflow/react/dist/style.css";
import {
  PageContainer,
  PageContentTitle,
  PageDescription,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowDataView } from "@/features/workflows/components/workflow-data-view";
import {
  getWorkflowTitleWithAuth,
  getWorkflowWithGraph,
} from "@/features/workflows/server/queries";
import { auth } from "@/lib/auth";
import { resolveMetadataLocale, resolveMetadataTitle } from "@/lib/metadata";
import { formatYMD } from "@/lib/utils";

const workflowFallbackTitles = {
  ko: "워크플로우",
  en: "Workflow",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/[id]">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const fallbackTitle = workflowFallbackTitles[locale];

  try {
    const title = await getWorkflowTitleWithAuth(id);

    return {
      title: resolveMetadataTitle({
        title,
        locale,
        localizedFallbacks: workflowFallbackTitles,
      }),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

export default function WorkflowDetailPage({
  params,
}: PageProps<"/[locale]/workflows/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<WorkflowDetailFallback />}>
        <WorkflowDetailContent paramsPromise={params} />
      </Suspense>
    </PageContainer>
  );
}

async function WorkflowDetailContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/workflows/[id]">["params"];
}) {
  const { id } = await paramsPromise;
  const workflowData = await getWorkflowWithGraph(id);
  const session = await auth();
  const userId = session?.user?.id;

  if (!workflowData || workflowData.workflow.ownerId !== userId) {
    notFound();
  }

  const { workflow, nodes, edges } = workflowData;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/workflows">
              <ChevronLeft />
              목록으로
            </Link>
          </Button>
          <div className="w-full space-y-1 pt-4 pl-4">
            <PageContentTitle>{workflow.title}</PageContentTitle>
            <PageDescription>
              {workflow.description ?? "설명이 없습니다."}
            </PageDescription>
            <div className="flex w-full items-center gap-1 pt-4 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <div>최근 업데이트 {formatYMD(workflow.updatedAt)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/workflows/canvas/${workflow.id}`}>
              캔버스에서 열기
            </Link>
          </Button>
        </div>
      </div>

      <WorkflowDataView nodes={nodes} edges={edges} />
    </div>
  );
}

function WorkflowDetailFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <div className="w-full space-y-3 pt-4 pl-4">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-5 w-80" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[480px] w-full rounded-xl" />
    </div>
  );
}
