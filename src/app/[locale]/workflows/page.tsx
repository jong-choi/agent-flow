import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowListView } from "@/features/workflows/components/workflow-list-view";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });

  return {
    title: t("meta.workflowsTitle"),
  };
}

export default async function WorkflowsPage({
  params,
}: PageProps<"/[locale]/workflows">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>{t("listPage.heading")}</PageHeading>
            <PageDescription>{t("listPage.description")}</PageDescription>
          </div>
          <Button asChild>
            <Link href="/workflows/canvas">{t("listPage.newWorkflow")}</Link>
          </Button>
        </div>
        <Suspense fallback={<WorkflowListViewFallback />}>
          <WorkflowListView locale={locale} />
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
