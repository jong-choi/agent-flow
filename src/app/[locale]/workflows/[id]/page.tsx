import { Suspense } from "react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";
import { formatYMD } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/[id]">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });
  const fallbackTitle = t("meta.workflowFallbackTitle");

  try {
    const title = await getWorkflowTitleWithAuth(id);
    const normalizedTitle = title?.trim() || fallbackTitle;

    return {
      title: normalizedTitle,
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
  const { id, locale } = await paramsPromise;
  const t = await getTranslations<AppMessageKeys>({
    locale: locale,
    namespace: "Workflows",
  });
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
              {t("detailPage.backToList")}
            </Link>
          </Button>
          <div className="w-full space-y-1 pt-4 pl-4">
            <PageContentTitle>{workflow.title}</PageContentTitle>
            <PageDescription>
              {workflow.description ?? t("detailPage.noDescription")}
            </PageDescription>
            <div className="flex w-full items-center gap-1 pt-4 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <div>
                {t("detailPage.updatedAt", {
                  date: formatYMD(workflow.updatedAt),
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/workflows/canvas/${workflow.id}`}>
              {t("detailPage.openInCanvas")}
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
