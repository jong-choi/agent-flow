import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { PagerButton } from "@/components/pager-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { PresetsFilter } from "@/features/presets/components/presets-filter";
import { PresetsList } from "@/features/presets/components/presets-list";
import { getPurchasedPresets } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets/purchased">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return {
    title: t("meta.libraryTitle"),
  };
}

function resolveParam(value: string | string[] | undefined, fallback: string) {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

export default async function PurchasedPresetsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/presets/purchased">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <PageContainer
      RightPanel={
        <FadeSuspense>
          <PresetsFilter variant="purchased" />
        </FadeSuspense>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>{t("purchasedPage.heading")}</PageHeading>
            <PageDescription>{t("purchasedPage.description")}</PageDescription>
          </PageHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/new">{t("purchasedPage.createPreset")}</Link>
            </Button>
            <Button asChild>
              <Link href="/workflows/canvas">
                {t("purchasedPage.openCanvas")}
              </Link>
            </Button>
          </div>
        </div>
        <FadeSuspense fallback={<PurchasedPresetsContentFallback />}>
          <PurchasedPresetsContent
            locale={locale}
            searchParams={searchParams}
          />
        </FadeSuspense>
      </div>
    </PageContainer>
  );
}

async function PurchasedPresetsContent({
  searchParams,
  locale,
}: {
  searchParams?: PageProps<"/[locale]/presets/purchased">["searchParams"];
  locale: string;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "latest");
  const rawOwnership = resolveParam(resolvedSearchParams?.ownership, "all");
  const selectedOwnership =
    rawOwnership === "purchased" || rawOwnership === "owned"
      ? rawOwnership
      : "all";
  const query = resolveParam(resolvedSearchParams?.q, "");
  const rawCursor = Array.isArray(resolvedSearchParams?.cursor)
    ? resolvedSearchParams?.cursor[0]
    : resolvedSearchParams?.cursor;
  const cursor = rawCursor?.trim() || undefined;
  const rawDir = Array.isArray(resolvedSearchParams?.dir)
    ? resolvedSearchParams?.dir[0]
    : resolvedSearchParams?.dir;
  const dir = rawDir === "prev" ? "prev" : "next";

  const purchasedPageResult = await getPurchasedPresets(
    {
      query,
      category: selectedCategory === "all" ? null : selectedCategory,
      sort:
        selectedSort === "name" ||
        selectedSort === "purchase" ||
        selectedSort === "latest"
          ? selectedSort
          : "latest",
      ownership: selectedOwnership,
    },
    { cursor, dir, limit: PAGE_SIZE },
  );

  const baseParams = {
    q: query,
    category: selectedCategory,
    sort: selectedSort,
    ownership: selectedOwnership,
  };
  const paginationDefaults = {
    category: "all",
    sort: "latest",
    ownership: "all",
  };
  const prevHref =
    purchasedPageResult.pageInfo.hasPrev &&
    purchasedPageResult.pageInfo.prevCursor
      ? `/presets/purchased${buildQueryString(
          baseParams,
          { cursor: purchasedPageResult.pageInfo.prevCursor, dir: "prev" },
          paginationDefaults,
        )}`
      : "";
  const nextHref =
    purchasedPageResult.pageInfo.hasNext &&
    purchasedPageResult.pageInfo.nextCursor
      ? `/presets/purchased${buildQueryString(
          baseParams,
          { cursor: purchasedPageResult.pageInfo.nextCursor, dir: "next" },
          paginationDefaults,
        )}`
      : "";
  const hasPager =
    purchasedPageResult.pageInfo.hasPrev ||
    purchasedPageResult.pageInfo.hasNext;
  const hasFilter =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedSort !== "latest" ||
    selectedOwnership !== "all";
  const hasPresets = purchasedPageResult.totalCount > 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("purchasedSection.totalCount", {
            count: purchasedPageResult.totalCount,
          })}
        </p>
      </div>
      {!hasPresets && !hasFilter ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("purchasedSection.emptyTitle")}</CardTitle>
            <CardDescription>
              {t("purchasedSection.emptyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/presets">{t("purchasedSection.viewMarket")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !hasPresets ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("purchasedSection.filteredEmptyTitle")}</CardTitle>
            <CardDescription>
              {t("purchasedSection.filteredEmptyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/presets/purchased">
                {t("purchasedSection.resetFilter")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ScrollArea className="min-h-0 flex-1">
            <div className="pb-3">
              <PresetsList
                locale={locale}
                items={purchasedPageResult.presets}
                variant="library"
              />
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
      )}
    </>
  );
}

function PurchasedPresetsContentFallback() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
