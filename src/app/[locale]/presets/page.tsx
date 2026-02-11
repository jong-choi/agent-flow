import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 50;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);

  return {
    title: locale === "ko" ? "프리셋 마켓" : "Preset Market",
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

export default function TemplateMarketPage({
  searchParams,
}: PageProps<"/[locale]/presets">) {
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
            <PageHeading>프리셋 마켓</PageHeading>
            <PageDescription>
              커뮤니티에서 만든 워크플로우를 구매하세요
            </PageDescription>
          </PageHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/new">프리셋 만들기</Link>
            </Button>
          </div>
        </div>
        <Card className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">내 프리셋</p>
              <p className="text-sm text-muted-foreground">
                구매하거나 만든 프리셋은 캔버스에서 바로 불러올 수 있습니다.
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/presets/purchased">내 프리셋 보기</Link>
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
        <p className="text-sm text-muted-foreground">{totalCount}개 프리셋</p>
      </div>
      {totalCount === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>공개된 프리셋이 없습니다</CardTitle>
            <CardDescription>
              아직 공개된 프리셋이 없어요. 곧 새로운 프리셋이 추가됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/workflows/canvas">첫 프리셋 만들기</Link>
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
