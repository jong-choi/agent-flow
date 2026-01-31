"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categoryFilters } from "@/features/preset/constants/category-options";

const PRICE_FILTERS = [
  { label: "전체", value: "all" },
  { label: "무료", value: "free" },
  { label: "1~2 크레딧", value: "1-2" },
  { label: "3~5 크레딧", value: "3-5" },
] as const;

const MARKET_SORT_OPTIONS = [
  { label: "인기순", value: "popular" },
  { label: "최신순", value: "latest" },
  { label: "평점순", value: "rating" },
  { label: "가격 낮은 순", value: "price-asc" },
] as const;

const PURCHASED_SORT_OPTIONS = [
  { label: "최신순", value: "latest" },
  { label: "구매일순", value: "purchase" },
  { label: "이름순", value: "name" },
] as const;

type PresetsFilterVariant = "market" | "purchased";
type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];
type MarketSortOption = (typeof MARKET_SORT_OPTIONS)[number]["value"];
type PurchasedSortOption = (typeof PURCHASED_SORT_OPTIONS)[number]["value"];
type CategoryFilter = (typeof categoryFilters)[number]["value"];

const resolveOption = (
  value: string,
  options: ReadonlyArray<{ value: string }>,
  fallback: string,
) => (options.some((option) => option.value === value) ? value : fallback);

const FILTER_CONFIGS = {
  market: {
    description: "조건을 선택하고 적용을 눌러 주세요.",
    searchPlaceholder: "워크플로우, 기능, 키워드로 검색",
    categoryLabel: "카테고리",
    priceLabel: "가격",
    sortLabel: "정렬",
    priceOptions: PRICE_FILTERS,
    sortOptions: MARKET_SORT_OPTIONS,
    defaults: {
      category: "all",
      price: "all",
      sort: "popular",
    },
  },
  purchased: {
    description: "조건을 선택하고 적용을 눌러 주세요.",
    searchPlaceholder: "프리셋 이름이나 키워드로 검색",
    categoryLabel: "카테고리",
    priceLabel: null,
    sortLabel: "정렬",
    priceOptions: null,
    sortOptions: PURCHASED_SORT_OPTIONS,
    defaults: {
      category: "all",
      price: "",
      sort: "latest",
    },
  },
} as const;

export function PresetsFilter({ variant }: { variant: PresetsFilterVariant }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const config = FILTER_CONFIGS[variant];

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    resolveOption(
      searchParams.get("category") ?? config.defaults.category,
      categoryFilters,
      config.defaults.category,
    ) as CategoryFilter,
  );
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>(() => {
    if (!config.priceOptions) {
      return "all";
    }

    return resolveOption(
      searchParams.get("price") ?? config.defaults.price,
      config.priceOptions,
      config.defaults.price,
    ) as PriceFilter;
  });
  const [selectedSort, setSelectedSort] = useState<
    MarketSortOption | PurchasedSortOption
  >(
    resolveOption(
      searchParams.get("sort") ?? config.defaults.sort,
      config.sortOptions,
      config.defaults.sort,
    ) as MarketSortOption | PurchasedSortOption,
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }
    if (selectedCategory !== config.defaults.category) {
      params.set("category", selectedCategory);
    }
    if (selectedPrice !== config.defaults.price && config.priceOptions) {
      params.set("price", selectedPrice);
    }
    if (selectedSort !== config.defaults.sort) {
      params.set("sort", selectedSort);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">필터</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <label
              htmlFor="preset-search"
              className="text-xs font-medium text-muted-foreground"
            >
              검색
            </label>
            <Input
              id="preset-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={config.searchPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {config.categoryLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((filter) => (
                <Button
                  key={filter.label}
                  type="button"
                  variant={
                    filter.value === selectedCategory ? "secondary" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                  aria-pressed={filter.value === selectedCategory}
                  onClick={() => setSelectedCategory(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {config.priceOptions ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {config.priceLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {config.priceOptions.map((filter) => (
                  <Button
                    key={filter.label}
                    type="button"
                    variant={
                      filter.value === selectedPrice ? "secondary" : "outline"
                    }
                    size="sm"
                    className="rounded-full"
                    aria-pressed={filter.value === selectedPrice}
                    onClick={() => setSelectedPrice(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {config.sortLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.sortOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={
                    option.value === selectedSort ? "secondary" : "outline"
                  }
                  size="sm"
                  aria-pressed={option.value === selectedSort}
                  onClick={() => setSelectedSort(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">적용</Button>
            <Button variant="outline" asChild>
              <Link href={pathname}>초기화</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
