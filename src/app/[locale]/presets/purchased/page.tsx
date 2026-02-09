import { Suspense } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import {
  getOwnedPresets,
  getPurchasedPresets,
  getPurchasedPresetsSummary,
} from "@/features/presets/server/queries";

const PAGE_SIZE = 50;

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

export default function PurchasedPresetsPage({
  searchParams,
}: PageProps<"/[locale]/presets/purchased">) {
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
            <PageHeading>내 프리셋</PageHeading>
            <PageDescription>
              생성하였거나 구매한 프리셋 목록입니다.
            </PageDescription>
          </PageHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/new">내 프리셋 만들기</Link>
            </Button>
            <Button asChild>
              <Link href="/workflows/canvas">캔버스 열기</Link>
            </Button>
          </div>
        </div>
        <Suspense fallback={<PurchasedPresetsContentFallback />}>
          <PurchasedPresetsContent searchParamsPromise={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function PurchasedPresetsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<PresetsLibrarySearchParams> | undefined;
}) {
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
            <p className="text-sm font-medium">내 프리셋 라이브러리</p>
            <p className="text-sm text-muted-foreground">
              전체 {totalPresetsCount}개 · 만든 {createdCount}개 · 구매{" "}
              {purchasedCount}개
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/presets">프리셋 마켓</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">내가 만든 프리셋</CardTitle>
        </CardHeader>
        <CardContent>
          {ownedPresets.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>아직 만든 프리셋이 없습니다</CardTitle>
                <CardDescription>
                  캔버스에서 새 프리셋을 만들고 저장해 보세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" asChild>
                  <Link href="/workflows/canvas">캔버스에서 만들기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[450px]">
              <div className="pb-14">
                <PresetsList items={ownedPresets} variant="library" />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          구매한 프리셋 {purchasedPageResult.totalCount}개
        </p>
      </div>
      {!hasPurchasedPresets ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>구매한 프리셋이 없습니다</CardTitle>
            <CardDescription>
              프리셋 마켓에서 새로운 프리셋을 둘러보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/presets">프리셋 마켓 보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : purchasedPageResult.totalCount === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>필터 결과가 없습니다</CardTitle>
            <CardDescription>
              선택한 조건에 맞는 구매 프리셋이 없습니다. 필터를 변경해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/presets/purchased">필터 초기화</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <PresetsList items={purchasedPageResult.presets} variant="library" />
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
