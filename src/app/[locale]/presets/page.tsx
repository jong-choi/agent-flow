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
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { getPresets } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 50;

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

type PresetsPageSearchParams = {
  q?: string | string[];
  category?: string | string[];
  price?: string | string[];
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
          <TemplateMarketContent searchParamsPromise={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function TemplateMarketContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<PresetsPageSearchParams> | undefined;
}) {
  const t = await getTranslations<AppMessageKeys>("Presets");
  const resolvedSearchParams = await searchParamsPromise;
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedPrice = resolveParam(resolvedSearchParams?.price, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "popular");
  const query = resolveParam(resolvedSearchParams?.q, "");
  const currentPage = resolvePage(resolvedSearchParams?.page);

  const priceRange =
    selectedPrice === "free"
      ? { min: 0, max: 0 }
      : selectedPrice === "1-2"
        ? { min: 1, max: 2 }
        : selectedPrice === "3-5"
          ? { min: 3, max: 5 }
          : null;

  const baseParams = {
    q: query,
    category: selectedCategory,
    price: selectedPrice,
    sort: selectedSort,
  };
  const paginationDefaults = {
    category: "all",
    price: "all",
    sort: "popular",
  };

  const { presets, totalCount } = await getPresets(
    {
      query,
      category: selectedCategory === "all" ? null : selectedCategory,
      priceMin: priceRange?.min,
      priceMax: priceRange?.max,
      sort:
        selectedSort === "latest" ||
        selectedSort === "rating" ||
        selectedSort === "price-asc"
          ? selectedSort
          : "popular",
    },
    { page: currentPage, pageSize: PAGE_SIZE },
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (currentPage > totalPages) {
    redirect(
      `/presets${buildQueryString(
        baseParams,
        { page: String(totalPages) },
        paginationDefaults,
      )}`,
    );
  }

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
              <Link href="/workflows/canvas">
                {t("marketContent.createFirstPreset")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <PresetsList items={presets} />
          <PresetsPagination
            basePath="/presets"
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
