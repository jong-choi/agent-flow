import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PresetsFilter } from "@/app/[locale]/presets/_components/presets-filter";
import { PresetsList } from "@/app/[locale]/presets/_components/presets-list";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { getPresets } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return {
    title: t("meta.marketTitle"),
  };
}

function resolveParam(value: string | string[] | undefined, fallback: string) {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

function resolvePriceParam(value: string | string[] | undefined) {
  const raw = resolveParam(value, "").trim();
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.floor(parsed));
}

function resolvePriceRange({
  priceMin,
  priceMax,
}: {
  priceMin: string | string[] | undefined;
  priceMax: string | string[] | undefined;
}) {
  const resolvedMin = resolvePriceParam(priceMin);
  const resolvedMax = resolvePriceParam(priceMax);

  if (resolvedMin != null && resolvedMax != null && resolvedMin > resolvedMax) {
    return {
      priceMin: resolvedMax,
      priceMax: resolvedMin,
    };
  }

  return {
    priceMin: resolvedMin,
    priceMax: resolvedMax,
  };
}

export default async function TemplateMarketPage({
  params,
  searchParams,
}: PageProps<"/[locale]/presets">) {
  const { locale } = await params;

  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <PageContainer
      RightPanel={
        <Suspense>
          <PresetsFilter variant="market" />
        </Suspense>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>{t("marketPage.heading")}</PageHeading>
            <PageDescription>{t("marketPage.description")}</PageDescription>
          </PageHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/new">{t("marketPage.createPreset")}</Link>
            </Button>
          </div>
        </div>
        <Card className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("marketPage.myPresets")}</p>
              <p className="text-sm text-muted-foreground">
                {t("marketPage.myPresetsDescription")}
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/presets/purchased">
                {t("marketPage.viewMyPresets")}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Suspense fallback={<TemplateMarketContentFallback />}>
          <TemplateMarketContent locale={locale} searchParams={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function TemplateMarketContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams?: PageProps<"/[locale]/presets">["searchParams"];
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "latest");
  const query = resolveParam(resolvedSearchParams?.q, "");
  const rawCursor = Array.isArray(resolvedSearchParams?.cursor)
    ? resolvedSearchParams?.cursor[0]
    : resolvedSearchParams?.cursor;
  const cursor = rawCursor?.trim() || undefined;
  const rawDir = Array.isArray(resolvedSearchParams?.dir)
    ? resolvedSearchParams?.dir[0]
    : resolvedSearchParams?.dir;
  const dir = rawDir === "prev" ? "prev" : "next";
  const { priceMin, priceMax } = resolvePriceRange({
    priceMin: resolvedSearchParams?.priceMin,
    priceMax: resolvedSearchParams?.priceMax,
  });

  const baseParams = {
    q: query,
    category: selectedCategory,
    priceMin: priceMin != null ? String(priceMin) : "",
    priceMax: priceMax != null ? String(priceMax) : "",
    sort: selectedSort,
  };
  const paginationDefaults = {
    category: "all",
    sort: "latest",
  };

  const { presets, totalCount, pageInfo } = await getPresets(
    {
      query,
      category: selectedCategory === "all" ? null : selectedCategory,
      priceMin: priceMin ?? undefined,
      priceMax: priceMax ?? undefined,
      sort:
        selectedSort === "popular" ||
        selectedSort === "latest" ||
        selectedSort === "rating" ||
        selectedSort === "price-asc"
          ? selectedSort
          : "latest",
    },
    { cursor, dir, limit: PAGE_SIZE },
  );

  const prevHref =
    pageInfo.hasPrev && pageInfo.prevCursor
      ? `/presets${buildQueryString(
          baseParams,
          { cursor: pageInfo.prevCursor, dir: "prev" },
          paginationDefaults,
        )}`
      : "";
  const nextHref =
    pageInfo.hasNext && pageInfo.nextCursor
      ? `/presets${buildQueryString(
          baseParams,
          { cursor: pageInfo.nextCursor, dir: "next" },
          paginationDefaults,
        )}`
      : "";
  const hasPager = pageInfo.hasPrev || pageInfo.hasNext;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("marketContent.totalCount", { count: totalCount })}
        </p>
      </div>
      {totalCount === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("marketContent.emptyTitle")}</CardTitle>
            <CardDescription>
              {t("marketContent.emptyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/presets/new">
                {t("marketContent.createFirstPreset")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ScrollArea className="min-h-0 flex-1">
            <div className="pb-3">
              <PresetsList locale={locale} items={presets} />
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

function TemplateMarketContentFallback() {
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
