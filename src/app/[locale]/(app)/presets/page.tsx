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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPresets } from "@/features/presets/server/actions";
import { buildQueryString } from "@/features/chats/utils/query-string";

const PAGE_SIZE = 50;

type PresetsPageSearchParams = {
  q?: string | string[];
  category?: string | string[];
  price?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

const resolveParam = (value: string | string[] | undefined, fallback: string) =>
  (Array.isArray(value) ? value[0] : value) ?? fallback;

const resolvePage = (value: string | string[] | undefined) => {
  const parsed = Number.parseInt(resolveParam(value, "1"), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

export default async function TemplateMarketPage({
  searchParams,
}: {
  searchParams?: Promise<PresetsPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
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
      <PageContainer>
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalCount}개 프리셋
            </p>
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
        </div>
      </PageContainer>
      <aside className="fixed top-20 right-10 w-full shrink-0 lg:w-72">
        <PresetsFilter variant="market" />
      </aside>
    </>
  );
}
