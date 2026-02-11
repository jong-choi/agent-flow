"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { categoryFilters } from "@/features/presets/constants/category-options";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const PRICE_FILTERS = [
  { key: "all", value: "all" },
  { key: "free", value: "free" },
  { key: "oneToTwo", value: "1-2" },
  { key: "threeToFive", value: "3-5" },
] as const;

const MARKET_SORT_OPTIONS = [
  { key: "popular", value: "popular" },
  { key: "latest", value: "latest" },
  { key: "rating", value: "rating" },
  { key: "priceAsc", value: "price-asc" },
] as const;

const PURCHASED_SORT_OPTIONS = [
  { key: "latest", value: "latest" },
  { key: "purchase", value: "purchase" },
  { key: "name", value: "name" },
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
    descriptionKey: "filters.marketDescription",
    searchPlaceholderKey: "filters.marketSearchPlaceholder",
    categoryLabelKey: "filters.categoryLabel",
    priceLabelKey: "filters.priceLabel",
    sortLabelKey: "filters.sortLabel",
    priceOptions: PRICE_FILTERS,
    sortOptions: MARKET_SORT_OPTIONS,
    sortOptionGroup: "marketSortOptions",
    defaults: {
      category: "all",
      price: "all",
      sort: "popular",
    },
  },
  purchased: {
    descriptionKey: "filters.purchasedDescription",
    searchPlaceholderKey: "filters.purchasedSearchPlaceholder",
    categoryLabelKey: "filters.categoryLabel",
    priceLabelKey: null,
    sortLabelKey: "filters.sortLabel",
    priceOptions: null,
    sortOptions: PURCHASED_SORT_OPTIONS,
    sortOptionGroup: "purchasedSortOptions",
    defaults: {
      category: "all",
      price: "",
      sort: "latest",
    },
  },
} as const;

export function PresetsFilter({ variant }: { variant: PresetsFilterVariant }) {
  const t = useTranslations<AppMessageKeys>("Presets");
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
        <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
        <CardDescription>{t(config.descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <label
              htmlFor="preset-search"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("filters.searchLabel")}
            </label>
            <Input
              id="preset-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(config.searchPlaceholderKey)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t(config.categoryLabelKey)}
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  variant={
                    filter.value === selectedCategory ? "secondary" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                  aria-pressed={filter.value === selectedCategory}
                  onClick={() => setSelectedCategory(filter.value)}
                >
                  {t(`categories.${filter.key}`)}
                </Button>
              ))}
            </div>
          </div>

          {config.priceOptions ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {config.priceLabelKey ? t(config.priceLabelKey) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {config.priceOptions.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant={
                      filter.value === selectedPrice ? "secondary" : "outline"
                    }
                    size="sm"
                    className="rounded-full"
                    aria-pressed={filter.value === selectedPrice}
                    onClick={() => setSelectedPrice(filter.value)}
                  >
                    {t(`filters.priceOptions.${filter.key}`)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t(config.sortLabelKey)}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.sortOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={
                    option.value === selectedSort ? "secondary" : "outline"
                  }
                  size="sm"
                  aria-pressed={option.value === selectedSort}
                  onClick={() => setSelectedSort(option.value)}
                >
                  {t(`filters.${config.sortOptionGroup}.${option.key}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">{t("filters.apply")}</Button>
            <Button variant="outline" asChild>
              <Link href={pathname}>{t("filters.reset")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
