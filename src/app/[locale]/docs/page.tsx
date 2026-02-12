import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { Separator } from "@/components/ui/separator";
import { CreateDocumentButton } from "@/features/documents/components/list/create-document-button";
import { DocumentsGrid } from "@/features/documents/components/list/documents-grid";
import { DocumentsSearch } from "@/features/documents/components/list/documents-search";
import { DocumentsSort } from "@/features/documents/components/list/documents-sort";
import { getDocumentsByOwner } from "@/features/documents/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

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
  const { q, sort: rawSort, page: rawPage } = resolvedSearchParams;
  const query = typeof q === "string" ? q : "";
  const sort = isSort(rawSort) ? rawSort : "recent";
  const page = toPageNumber(rawPage);

  const { documents } = await getDocumentsByOwner(
    {
      query,
      sort,
    },
    { page, pageSize: 100 },
  );

  return (
    <>
      <div className="flex">
        <DocumentsSort locale={locale} searchParams={resolvedSearchParams} />
        <DocumentsSearch />
      </div>
      <DocumentsGrid locale={locale} documents={documents} query={query} />
    </>
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

function toPageNumber(raw: unknown, fallback = 1): number {
  if (typeof raw !== "string") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : fallback;
}
