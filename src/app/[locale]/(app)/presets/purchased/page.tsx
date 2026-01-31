import Link from "next/link";
import { redirect } from "next/navigation";
import { PresetsFilter } from "@/app/[locale]/(app)/presets/_components/presets-filter";
import { PresetsList } from "@/app/[locale]/(app)/presets/_components/presets-list";
import { PresetsPagination } from "@/app/[locale]/(app)/presets/_components/presets-pagination";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getOwnedPresets,
  getPurchasedPresets,
  getPurchasedPresetsSummary,
} from "@/db/query/presets";
import { buildQueryString } from "@/features/chat/utils/query-string";
import { formatKoreanDate } from "@/lib/utils";

const PAGE_SIZE = 50;

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatKoreanDate(value, "날짜 없음");

type PresetsLibrarySearchParams = {
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

const resolveParam = (value: string | string[] | undefined, fallback: string) =>
  (Array.isArray(value) ? value[0] : value) ?? fallback;

const resolvePage = (value: string | string[] | undefined) => {
  const parsed = Number.parseInt(resolveParam(value, "1"), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

export default async function PurchasedPresetsPage({
  searchParams,
}: {
  searchParams?: Promise<PresetsLibrarySearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
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

  const ownedFreeCount = ownedPresets.filter(
    (preset) => preset.price === 0,
  ).length;
  const totalPresetsCount = ownedPresets.length + purchasedSummary.totalCount;
  const createdCount = ownedPresets.length;
  const purchasedCount = purchasedSummary.totalCount;
  const freeCount = ownedFreeCount + purchasedSummary.freeCount;

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
      <PageContainer>
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
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
                <Link href="/canvas">캔버스 열기</Link>
              </Button>
            </div>
          </div>

          <Card className="py-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">내 프리셋 라이브러리</p>
                <p className="text-sm text-muted-foreground">
                  전체 {totalPresetsCount}개 · 만든 {createdCount}개 · 구매{" "}
                  {purchasedCount}개 · 무료 {freeCount}개
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/presets">프리셋 마켓</Link>
              </Button>
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
                  선택한 조건에 맞는 구매 프리셋이 없습니다. 필터를 변경해
                  주세요.
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
              <PresetsList
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">내가 만든 프리셋</CardTitle>
              <CardDescription>
                필터 없이 만들어 둔 프리셋을 스크롤로 바로 확인합니다.
              </CardDescription>
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
                      <Link href="/canvas">캔버스에서 만들기</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[520px] pr-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {ownedPresets.map((preset) => {
                      const visibleTags = preset.tags.slice(0, 5);
                      const hasMoreTags = preset.tags.length > 5;

                      return (
                        <Card key={preset.id} className="h-full">
                          <CardHeader>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                {preset.category ?? "미분류"}
                              </span>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                내가 만든
                              </span>
                              <span>
                                업데이트 {formatDate(preset.updatedAt)}
                              </span>
                              {preset.isPublished === false ? (
                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  비공개
                                </span>
                              ) : null}
                            </div>
                            <CardTitle className="text-lg">
                              {preset.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {preset.description ?? "설명이 없습니다."}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {visibleTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {visibleTags.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                                {hasMoreTags ? (
                                  <Badge variant="secondary">...</Badge>
                                ) : null}
                              </div>
                            ) : null}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>가격 {formatPrice(preset.price)}</span>
                              <span>
                                제작자 {preset.ownerName ?? "알 수 없음"}
                              </span>
                            </div>
                          </CardContent>
                          <CardFooter className="gap-2 border-t">
                            <Button size="sm" className="flex-1" asChild>
                              <Link href={`/canvas/${preset.workflowId}`}>
                                캔버스에서 열기
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              asChild
                            >
                              <Link href={`/presets/${preset.id}`}>
                                상세 보기
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
      <aside className="fixed top-20 right-10 w-full shrink-0 lg:w-72">
        <PresetsFilter variant="purchased" />
      </aside>
    </>
  );
}
