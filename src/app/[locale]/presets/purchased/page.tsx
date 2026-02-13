import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PresetsFilter } from "@/app/[locale]/presets/_components/presets-filter";
import { PresetsList } from "@/app/[locale]/presets/_components/presets-list";
import { PresetsPagination } from "@/app/[locale]/presets/_components/presets-pagination";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
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
import {
  getOwnedPresets,
  getPurchasedPresets,
  getPurchasedPresetsSummary,
} from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 50;

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

type PresetsLibrarySearchParams = {
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

function resolveParam(value: string | string[] | undefined, fallback: string) {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

function resolvePage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(resolveParam(value, "1"), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
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
        <Suspense>
          <PresetsFilter variant="purchased" />
        </Suspense>
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
        <Suspense fallback={<PurchasedPresetsContentFallback />}>
          <PurchasedPresetsContent
            locale={locale}
            searchParamsPromise={searchParams}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function PurchasedPresetsContent({
  searchParamsPromise,
  locale,
}: {
  searchParamsPromise: Promise<PresetsLibrarySearchParams> | undefined;
  locale: string;
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const resolvedSearchParams = await searchParamsPromise;
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "latest");
  const query = resolveParam(resolvedSearchParams?.q, "");
  const currentPage = resolvePage(resolvedSearchParams?.page);

  const [ownedPresets, purchasedSummary, purchasedPageResult] =
    await Promise.all([
      getOwnedPresets(),
      getPurchasedPresetsSummary(),
      getPurchasedPresets({
        query,
        category: selectedCategory === "all" ? null : selectedCategory,
        sort:
          selectedSort === "name" ||
          selectedSort === "purchase" ||
          selectedSort === "latest"
            ? selectedSort
            : "latest",
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
    ]);

  const totalPresetsCount = ownedPresets.length + purchasedSummary.totalCount;
  const createdCount = ownedPresets.length;
  const purchasedCount = purchasedSummary.totalCount;

  const baseParams = {
    q: query,
    category: selectedCategory,
    sort: selectedSort,
  };
  const paginationDefaults = {
    category: "all",
    sort: "latest",
  };

  const totalPages = Math.max(
    1,
    Math.ceil(purchasedPageResult.totalCount / PAGE_SIZE),
  );

  if (currentPage > totalPages) {
    redirect(
      `/presets/purchased${buildQueryString(
        baseParams,
        { page: String(totalPages) },
        paginationDefaults,
      )}`,
    );
  }
  const hasPurchasedPresets = purchasedSummary.totalCount > 0;

  return (
    <>
      <Card className="py-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("librarySummary.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("librarySummary.stats", {
                total: totalPresetsCount,
                created: createdCount,
                purchased: purchasedCount,
              })}
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/presets">{t("librarySummary.marketButton")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ownedSection.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {ownedPresets.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>{t("ownedSection.emptyTitle")}</CardTitle>
                <CardDescription>
                  {t("ownedSection.emptyDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" asChild>
                  <Link href="/presets/new">
                    {t("ownedSection.createFromWorkflows")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[450px]">
              <div className="pb-14">
                <PresetsList
                  locale={locale}
                  items={ownedPresets}
                  variant="library"
                />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("purchasedSection.totalCount", {
            count: purchasedPageResult.totalCount,
          })}
        </p>
      </div>
      {!hasPurchasedPresets ? (
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
      ) : purchasedPageResult.totalCount === 0 ? (
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
        <>
          <PresetsList
            locale={locale}
            items={purchasedPageResult.presets}
            variant="library"
          />
          <PresetsPagination
            basePath="/presets/purchased"
            currentPage={currentPage}
            totalPages={totalPages}
            params={baseParams}
            defaults={paginationDefaults}
          />
        </>
      )}
    </>
  );
}

function PurchasedPresetsContentFallback() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
