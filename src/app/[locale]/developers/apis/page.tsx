import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PagerButton } from "@/components/pager-button";
import {
  PageContainer,
  PageDescription,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { WorkflowApiList } from "@/features/developers/components/apis/workflow-api-list";
import { getOwnedWorkflowsPage } from "@/features/workflows/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 18;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/developers/apis">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });

  return {
    title: t("meta.workflowApiTitle"),
  };
}

export default async function DevelopersApisPage({
  params,
  searchParams,
}: PageProps<"/[locale]/developers/apis">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });
  const baseUrl = process.env.BASE_URL || "";

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>{t("apisPage.heading")}</PageHeading>
            <PageDescription>
              {t.rich("apisPage.description", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </PageDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href="/developers">{t("apisPage.serviceKeysButton")}</Link>
          </Button>
        </div>

        <Suspense fallback={<WorkflowApiListFallback />}>
          <WorkflowApiListServer baseUrl={baseUrl} searchParams={searchParams} />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

async function WorkflowApiListServer({
  baseUrl,
  searchParams,
}: {
  baseUrl: string;
  searchParams?: PageProps<"/[locale]/developers/apis">["searchParams"];
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawCursor = Array.isArray(resolvedSearchParams?.cursor)
    ? resolvedSearchParams?.cursor[0]
    : resolvedSearchParams?.cursor;
  const cursor = rawCursor?.trim() || undefined;
  const rawDir = Array.isArray(resolvedSearchParams?.dir)
    ? resolvedSearchParams?.dir[0]
    : resolvedSearchParams?.dir;
  const dir = rawDir === "prev" ? "prev" : "next";
  const workflowPage = await getOwnedWorkflowsPage({
    cursor,
    dir,
    limit: PAGE_SIZE,
  });

  if (workflowPage.items.length === 0) {
    return <WorkflowApiList workflows={workflowPage.items} baseUrl={baseUrl} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-3">
          <WorkflowApiList workflows={workflowPage.items} baseUrl={baseUrl} />
        </div>
      </ScrollArea>
      {workflowPage.pageInfo.hasPrev || workflowPage.pageInfo.hasNext ? (
        <div className="shrink-0 border-t border-border/60 pt-4">
          <div className="flex items-center justify-center gap-2">
            <PagerButton
              direction="prev"
              href={
                workflowPage.pageInfo.hasPrev && workflowPage.pageInfo.prevCursor
                  ? `/developers/apis${buildQueryString(
                      {},
                      { cursor: workflowPage.pageInfo.prevCursor, dir: "prev" },
                    )}`
                  : undefined
              }
              disabled={!workflowPage.pageInfo.hasPrev}
            />
            <PagerButton
              direction="next"
              href={
                workflowPage.pageInfo.hasNext && workflowPage.pageInfo.nextCursor
                  ? `/developers/apis${buildQueryString(
                      {},
                      { cursor: workflowPage.pageInfo.nextCursor, dir: "next" },
                    )}`
                  : undefined
              }
              disabled={!workflowPage.pageInfo.hasNext}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowApiListFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border/60 bg-background p-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
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
