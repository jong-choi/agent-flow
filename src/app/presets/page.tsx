import Link from "next/link";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db/client";
import { getPresets } from "@/db/query/presets";
import { users } from "@/db/schema";
import { categoryFilters } from "@/features/preset/constants/category-options";
import { auth } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/utils";

const priceFilters = [
  { label: "전체", value: "all" },
  { label: "무료", value: "free" },
  { label: "1~2 크레딧", value: "1-2" },
  { label: "3~5 크레딧", value: "3-5" },
];

const sortOptions = [
  { label: "인기순", value: "popular" },
  { label: "최신순", value: "latest" },
  { label: "평점순", value: "rating" },
  { label: "가격 낮은 순", value: "price-asc" },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatKoreanDate(value, "날짜 없음");

type PresetsPageSearchParams = {
  q?: string | string[];
  category?: string | string[];
  price?: string | string[];
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
    if (key === "price" && value === "all") return;
    if (key === "sort" && value === "popular") return;
    if (key === "q" && value.trim() === "") return;
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export default async function TemplateMarketPage({
  searchParams,
}: {
  searchParams?: Promise<PresetsPageSearchParams> | PresetsPageSearchParams;
}) {
  const session = await auth();
  const email = session?.user?.email;
  let viewerId: string | undefined;

  if (email) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    viewerId = user?.id;
  }

  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolveParam(resolvedSearchParams?.category, "all");
  const selectedPrice = resolveParam(resolvedSearchParams?.price, "all");
  const selectedSort = resolveParam(resolvedSearchParams?.sort, "popular");
  const query = resolveParam(resolvedSearchParams?.q, "");

  const priceRange =
    selectedPrice === "free"
      ? { min: 0, max: 0 }
      : selectedPrice === "1-2"
        ? { min: 1, max: 2 }
        : selectedPrice === "3-5"
          ? { min: 3, max: 5 }
          : null;

  const presets = await getPresets(viewerId, {
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
  });

  const baseParams = {
    q: query,
    category: selectedCategory,
    price: selectedPrice,
    sort: selectedSort,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">마켓플레이스</p>
            <h1 className="text-2xl font-semibold">프리셋 마켓</h1>
            <p className="text-sm text-muted-foreground">
              커뮤니티에서 만든 워크플로우 프리셋을 찾아보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/new">프리셋 만들기</Link>
            </Button>
            <Button asChild>
              <Link href="/canvas">캔버스 열기</Link>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">검색 및 필터</CardTitle>
            <CardDescription>
              가격과 카테고리로 프리셋을 빠르게 찾아보세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action="/presets"
              method="get"
              className="flex flex-col gap-3 md:flex-row md:items-center"
            >
              <div className="flex-1">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="워크플로우, 기능, 키워드로 검색"
                />
              </div>
              <input type="hidden" name="category" value={selectedCategory} />
              <input type="hidden" name="price" value={selectedPrice} />
              <input type="hidden" name="sort" value={selectedSort} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary">
                  검색
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/presets">필터 초기화</Link>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
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
                        href={`/presets${buildQueryString(baseParams, {
                          category: filter.value,
                        })}`}
                      >
                        {filter.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  가격
                </p>
                <div className="flex flex-wrap gap-2">
                  {priceFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant={
                        filter.value === selectedPrice ? "secondary" : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      asChild
                    >
                      <Link
                        href={`/presets${buildQueryString(baseParams, {
                          price: filter.value,
                        })}`}
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
            추천 {presets.length}개 프리셋
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
                  href={`/presets${buildQueryString(baseParams, {
                    sort: option.value,
                  })}`}
                >
                  {option.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {presets.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>공개된 프리셋이 없습니다</CardTitle>
              <CardDescription>
                아직 공개된 프리셋이 없어요. 곧 새로운 프리셋이 추가됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/canvas">첫 프리셋 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => {
              const actionLabel = preset.isPurchased
                ? "이미 보유함"
                : preset.price === 0
                  ? "무료로 받기"
                  : "구매하기";
              const actionVariant = preset.isPurchased
                ? "secondary"
                : preset.price === 0
                  ? "secondary"
                  : "default";

              return (
                <Card key={preset.id} className="h-full">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {preset.category ?? "미분류"}
                      </span>
                      <span>업데이트 {formatDate(preset.updatedAt)}</span>
                    </div>
                    <CardTitle className="text-lg">{preset.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {preset.summary ??
                        preset.description ??
                        "설명이 없습니다."}
                    </CardDescription>
                    <CardAction>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        {formatPrice(preset.price)}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>구매 {preset.purchaseCount}</span>
                      <span>제작자 {preset.ownerName ?? "알 수 없음"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/presets/${preset.id}`}>상세 보기</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant={actionVariant}
                      className="flex-1"
                      disabled={preset.isPurchased}
                    >
                      {actionLabel}
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
