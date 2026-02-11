import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  PageContainer,
  PageDescription,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowListView } from "@/features/workflows/components/workflow-list-view";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);

  return {
    title: locale === "ko" ? "워크플로우" : "Workflows",
  };
}

export default function WorkflowsPage() {
  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>내 워크플로우</PageHeading>
            <PageDescription>
              플로우 캔버스에서 만든 그래프입니다.
            </PageDescription>
          </div>
          <Button asChild>
            <Link href="/workflows/canvas">새 워크플로우</Link>
          </Button>
        </div>
        <Suspense fallback={<WorkflowListViewFallback />}>
          <WorkflowListView />
        </Suspense>
      </div>
    </PageContainer>
  );
}

function WorkflowListViewFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border/60 bg-background p-4"
        >
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-2 flex items-end justify-between">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
