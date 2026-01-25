import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
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
import { Input } from "@/components/ui/input";
import { db } from "@/db/client";
import {
  getOwnedPresets,
  getPresetLibrary,
  getPurchasedPresets,
} from "@/db/query/presets";
import { users } from "@/db/schema";
import { categoryFilters } from "@/features/preset/constants/category-options";
import { auth } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/utils";

const libraryFilters = [
  { label: "전체", value: "all" },
  { label: "최근 사용", value: "recent" },
  { label: "즐겨찾기", value: "favorite" },
];

const sortOptions = [
  { label: "최근 사용순", value: "recent" },
  { label: "구매일순", value: "purchase" },
  { label: "이름순", value: "name" },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatKoreanDate(value, "날짜 없음");

type PresetsLibrarySearchParams = {
  q?: string | string[];
  category?: string | string[];
  status?: string | string[];
  sort?: string | string[];
};

const resolveParam = (value: string | string[] | undefined, fallback: string) =>
  (Array.isArray(value) ? value[0] : value) ?? fallback;

const buildQueryString = (
  base: { [key: string]: string },
  overrides: Partial<{ [key: string]: string }>,
) => {
  const params = new URLSearchParams();
  const next = { ...base, ...overrides };

  Object.entries(next).forEach(([key, value]) => {
    if (!value) return;
    if (key === "category" && value === "all") return;
    if (key === "status" && value === "all") return;
    if (key === "sort" && value === "recent") return;
    if (key === "q" && value.trim() === "") return;
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export default async function PurchasedPresetsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<PresetsLibrarySearchParams>
    | PresetsLibrarySearchParams;
}) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const rawStatus = resolveParam(resolvedSearchParams?.status, "all");
  const allowedStatuses = new Set(["all", "recent", "favorite"]);
  const selectedStatus = allowedStatuses.has(rawStatus)
    ? (rawStatus as "all" | "recent" | "favorite")
    : "all";
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "recent");
  const query = resolveParam(resolvedSearchParams?.q, "");

  const [purchasedPresets, ownedPresets, libraryPresets] = await Promise.all([
    getPurchasedPresets(user.id),
    getOwnedPresets(user.id),
    getPresetLibrary(user.id, {
      query,
      category: selectedCategory === "all" ? null : selectedCategory,
      status: selectedStatus,
      sort:
        selectedSort === "name" || selectedSort === "purchase"
          ? selectedSort
          : "recent",
    }),
  ]);

  const ownedIds = new Set(ownedPresets.map((preset) => preset.id));
  const purchasedOnly = purchasedPresets.filter(
    (preset) => !ownedIds.has(preset.id),
  );
  const totalPresetsCount = ownedPresets.length + purchasedOnly.length;
  const createdCount = ownedPresets.length;
  const purchasedCount = purchasedOnly.length;
  const freeCount = [...ownedPresets, ...purchasedOnly].filter(
    (preset) => preset.price === 0,
  ).length;

  const baseParams = {
    q: query,
    category: selectedCategory,
    status: selectedStatus,
    sort: selectedSort,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 라이브러리</p>
            <h1 className="text-2xl font-semibold">내 프리셋</h1>
            <p className="text-sm text-muted-foreground">
              구매하거나 만든 프리셋을 관리하고 캔버스에서 바로 불러옵니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets">프리셋 마켓</Link>
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
              <Link href="/canvas">내 프리셋 불러오기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">검색 및 필터</CardTitle>
            <CardDescription>
              상태와 카테고리로 내 프리셋을 빠르게 정리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action="/presets/purchased"
              method="get"
              className="flex flex-col gap-3 md:flex-row md:items-center"
            >
              <div className="flex-1">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="프리셋 이름이나 키워드로 검색"
                />
              </div>
              <input type="hidden" name="category" value={selectedCategory} />
              <input type="hidden" name="status" value={selectedStatus} />
              <input type="hidden" name="sort" value={selectedSort} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary">
                  검색
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/presets/purchased">필터 초기화</Link>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  상태
                </p>
                <div className="flex flex-wrap gap-2">
                  {libraryFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant={
                        filter.value === selectedStatus
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      asChild
                    >
                      <Link
                        href={`/presets/purchased${buildQueryString(
                          baseParams,
                          { status: filter.value },
                        )}`}
                      >
                        {filter.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  카테고리
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant={
                        filter.value === selectedCategory
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      asChild
                    >
                      <Link
                        href={`/presets/purchased${buildQueryString(
                          baseParams,
                          { category: filter.value },
                        )}`}
                      >
                        {filter.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            내 프리셋 {libraryPresets.length}개
          </p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.label}
                variant={
                  option.value === selectedSort ? "secondary" : "outline"
                }
                size="sm"
                asChild
              >
                <Link
                  href={`/presets/purchased${buildQueryString(baseParams, {
                    sort: option.value,
                  })}`}
                >
                  {option.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {totalPresetsCount === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>내 프리셋이 없습니다</CardTitle>
              <CardDescription>
                프리셋 마켓에서 구매하거나 직접 만들어 보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/presets">프리셋 마켓 보기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : libraryPresets.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>필터 결과가 없습니다</CardTitle>
              <CardDescription>
                선택한 조건에 맞는 프리셋이 없습니다. 필터를 변경해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/presets/purchased">필터 초기화</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {libraryPresets.map((preset) => {
              const isCreated = preset.source === "created";
              const dateLabel = isCreated ? "업데이트" : "구매";
              const canvasHref = isCreated
                ? `/canvas/${preset.workflowId}`
                : "/canvas";
              const visibleTags = preset.tags.slice(0, 5);
              const hasMoreTags = preset.tags.length > 5;

              return (
                <Card key={preset.id} className="h-full">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {preset.category ?? "미분류"}
                      </span>
                      {isCreated ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          내가 만든
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          구매
                        </span>
                      )}
                      <span>
                        {dateLabel} {formatDate(preset.displayDate)}
                      </span>
                      {isCreated && preset.isPublished === false ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          비공개
                        </span>
                      ) : null}
                    </div>
                    <CardTitle className="text-lg">{preset.title}</CardTitle>
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
                      <span>제작자 {preset.ownerName ?? "알 수 없음"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 border-t">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={canvasHref}>캔버스에서 열기</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/presets/${preset.id}`}>상세 보기</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
