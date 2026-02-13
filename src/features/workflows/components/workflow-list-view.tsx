import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PagerButton } from "@/components/pager-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { WorkflowListCard } from "@/features/workflows/components/workflow-list-card";
import { getOwnedWorkflowsPage } from "@/features/workflows/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const PAGE_SIZE = 18;

type WorkflowListViewProps = {
  locale: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function WorkflowListView({
  locale,
  searchParams,
}: WorkflowListViewProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });
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

  return (
    <>
      {workflowPage.items.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("listView.emptyTitle")}</CardTitle>
            <CardDescription>{t("listView.emptyDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/workflows/canvas">
                {t("listView.createWorkflow")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 pb-3 md:grid-cols-2 xl:grid-cols-3">
              {workflowPage.items.map((workflow) => (
                <WorkflowListCard
                  key={workflow.id}
                  href={`/workflows/canvas/${workflow.id}`}
                  workflowId={workflow.id}
                  title={workflow.title}
                  description={workflow.description}
                  updatedAt={workflow.updatedAt}
                  actionLabel={t("listView.detail")}
                />
              ))}
            </div>
          </ScrollArea>
          {workflowPage.pageInfo.hasPrev || workflowPage.pageInfo.hasNext ? (
            <div className="shrink-0 border-t border-border/60 pt-4">
              <div className="flex items-center justify-center gap-2">
                <PagerButton
                  direction="prev"
                  href={
                    workflowPage.pageInfo.hasPrev &&
                    workflowPage.pageInfo.prevCursor
                      ? `/workflows${buildQueryString(
                          {},
                          {
                            cursor: workflowPage.pageInfo.prevCursor,
                            dir: "prev",
                          },
                        )}`
                      : undefined
                  }
                  disabled={!workflowPage.pageInfo.hasPrev}
                />
                <PagerButton
                  direction="next"
                  href={
                    workflowPage.pageInfo.hasNext &&
                    workflowPage.pageInfo.nextCursor
                      ? `/workflows${buildQueryString(
                          {},
                          {
                            cursor: workflowPage.pageInfo.nextCursor,
                            dir: "next",
                          },
                        )}`
                      : undefined
                  }
                  disabled={!workflowPage.pageInfo.hasNext}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
