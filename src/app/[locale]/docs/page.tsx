import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { PagerButton } from "@/components/pager-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { CreateDocumentButton } from "@/features/documents/components/list/create-document-button";
import { DocumentsGrid } from "@/features/documents/components/list/documents-grid";
import { DocumentsSearch } from "@/features/documents/components/list/documents-search";
import { DocumentsSort } from "@/features/documents/components/list/documents-sort";
import { getDocumentsByOwner } from "@/features/documents/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/docs">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Docs",
  });

  return {
    title: t("meta.documentsTitle"),
  };
}

export default async function DocsPage(props: PageProps<"/[locale]/docs">) {
  const { locale } = await props.params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Docs",
  });

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>{t("listPage.heading")}</PageHeading>
            <PageDescription>{t("listPage.description")}</PageDescription>
          </PageHeader>
          <CreateDocumentButton />
        </div>
        <Separator />
        <Suspense fallback={<DocsContentFallback />}>
          <DocsContent
            locale={locale}
            searchParamsPromise={props.searchParams}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function DocsContent({
  locale,
  searchParamsPromise,
}: {
  locale: string;
  searchParamsPromise: PageProps<"/[locale]/docs">["searchParams"];
}) {
  const resolvedSearchParams = await searchParamsPromise;
  const { q, sort: rawSort } = resolvedSearchParams;
  const query = typeof q === "string" ? q : "";
  const sort = isSort(rawSort) ? rawSort : "recent";
  const rawCursor = Array.isArray(resolvedSearchParams?.cursor)
    ? resolvedSearchParams.cursor[0]
    : resolvedSearchParams?.cursor;
  const cursor = rawCursor?.trim() || undefined;
  const rawDir = Array.isArray(resolvedSearchParams?.dir)
    ? resolvedSearchParams.dir[0]
    : resolvedSearchParams?.dir;
  const dir = rawDir === "prev" ? "prev" : "next";

  const { documents, pageInfo } = await getDocumentsByOwner(
    {
      query,
      sort,
    },
    { cursor, dir, limit: PAGE_SIZE },
  );

  const baseParams = { q: query, sort };
  const paginationDefaults = { sort: "recent" };
  const prevHref =
    pageInfo.hasPrev && pageInfo.prevCursor
      ? `/docs${buildQueryString(
          baseParams,
          { cursor: pageInfo.prevCursor, dir: "prev" },
          paginationDefaults,
        )}`
      : "";
  const nextHref =
    pageInfo.hasNext && pageInfo.nextCursor
      ? `/docs${buildQueryString(
          baseParams,
          { cursor: pageInfo.nextCursor, dir: "next" },
          paginationDefaults,
        )}`
      : "";
  const hasPager = pageInfo.hasPrev || pageInfo.hasNext;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex">
        <DocumentsSort locale={locale} searchParams={resolvedSearchParams} />
        <DocumentsSearch />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-3">
          <DocumentsGrid locale={locale} documents={documents} query={query} />
        </div>
      </ScrollArea>
      {hasPager ? (
        <div className="shrink-0 border-t border-border/60 pt-4">
          <div className="flex items-center justify-center gap-2">
            <PagerButton
              direction="prev"
              href={prevHref || undefined}
              disabled={!prevHref}
            />
            <PagerButton
              direction="next"
              href={nextHref || undefined}
              disabled={!nextHref}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocsContentFallback() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-full animate-pulse rounded bg-muted/70" />
      <div className="h-48 w-full animate-pulse rounded bg-muted/60" />
    </div>
  );
}

const sortValues = ["recent", "latest", "oldest", "name"] as const;
type Sort = (typeof sortValues)[number];
function isSort(value: unknown): value is Sort {
  return (
    typeof value === "string" &&
    (sortValues as readonly string[]).includes(value)
  );
}
