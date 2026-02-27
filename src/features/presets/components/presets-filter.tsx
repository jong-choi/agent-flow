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

const MARKET_PRICE_FILTERS = [
  { key: "free", value: "free" },
  { key: "oneToFive", value: "oneToFive" },
  { key: "fiveToTen", value: "fiveToTen" },
  { key: "overTen", value: "overTen" },
] as const;

const MARKET_SORT_OPTIONS = [
  { key: "latest", value: "latest" },
  { key: "popular", value: "popular" },
  { key: "rating", value: "rating" },
  { key: "priceAsc", value: "price-asc" },
] as const;

const PURCHASED_SORT_OPTIONS = [
  { key: "latest", value: "latest" },
  { key: "purchase", value: "purchase" },
  { key: "name", value: "name" },
] as const;
const PURCHASED_OWNERSHIP_OPTIONS = [
  { key: "all", value: "all" },
  { key: "purchased", value: "purchased" },
  { key: "owned", value: "owned" },
] as const;

type PresetsFilterVariant = "market" | "purchased";
type MarketPriceFilter = (typeof MARKET_PRICE_FILTERS)[number]["value"];
type MarketSortOption = (typeof MARKET_SORT_OPTIONS)[number]["value"];
type PurchasedSortOption = (typeof PURCHASED_SORT_OPTIONS)[number]["value"];
type CategoryFilter = (typeof categoryFilters)[number]["value"];
type PurchasedOwnershipOption =
  (typeof PURCHASED_OWNERSHIP_OPTIONS)[number]["value"];

const resolveOption = (
  value: string,
  options: ReadonlyArray<{ value: string }>,
  fallback: string,
) => (options.some((option) => option.value === value) ? value : fallback);

const parsePriceParam = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.floor(parsed));
};

const resolveMarketPriceFilter = (
  priceMinInput: string,
  priceMaxInput: string,
): MarketPriceFilter | null => {
  const priceMin = parsePriceParam(priceMinInput);
  const priceMax = parsePriceParam(priceMaxInput);

  if (priceMin === 0 && priceMax === 0) {
    return "free";
  }

  if (priceMin === 1 && priceMax === 5) {
    return "oneToFive";
  }

  if (priceMin === 5 && priceMax === 10) {
    return "fiveToTen";
  }

  if (priceMin != null && priceMin > 10 && priceMax == null) {
    return "overTen";
  }

  return null;
};

const resolveMarketPriceRange = (selectedPriceFilter: MarketPriceFilter | null) => {
  if (selectedPriceFilter === "free") {
    return { priceMin: "0", priceMax: "0" };
  }

  if (selectedPriceFilter === "oneToFive") {
    return { priceMin: "1", priceMax: "5" };
  }

  if (selectedPriceFilter === "fiveToTen") {
    return { priceMin: "5", priceMax: "10" };
  }

  if (selectedPriceFilter === "overTen") {
    return { priceMin: "11", priceMax: null };
  }

  return {
    priceMin: null,
    priceMax: null,
  };
};

const FILTER_CONFIGS = {
  market: {
    descriptionKey: "filters.marketDescription",
    searchPlaceholderKey: "filters.marketSearchPlaceholder",
    categoryLabelKey: "filters.categoryLabel",
    sortLabelKey: "filters.sortLabel",
    sortOptions: MARKET_SORT_OPTIONS,
    sortOptionGroup: "marketSortOptions",
    defaults: {
      category: "all",
      sort: "latest",
    },
  },
  purchased: {
    descriptionKey: "filters.purchasedDescription",
    searchPlaceholderKey: "filters.purchasedSearchPlaceholder",
    categoryLabelKey: "filters.categoryLabel",
    sortLabelKey: "filters.sortLabel",
    sortOptions: PURCHASED_SORT_OPTIONS,
    sortOptionGroup: "purchasedSortOptions",
    defaults: {
      category: "all",
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
  const initialPriceMin = searchParams.get("priceMin") ?? "";
  const initialPriceMax = searchParams.get("priceMax") ?? "";

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    resolveOption(
      searchParams.get("category") ?? config.defaults.category,
      categoryFilters,
      config.defaults.category,
    ) as CategoryFilter,
  );
  const [selectedPriceFilter, setSelectedPriceFilter] =
    useState<MarketPriceFilter | null>(() =>
      resolveMarketPriceFilter(initialPriceMin, initialPriceMax),
    );
  const [selectedSort, setSelectedSort] = useState<
    MarketSortOption | PurchasedSortOption
  >(
    resolveOption(
      searchParams.get("sort") ?? config.defaults.sort,
      config.sortOptions,
      config.defaults.sort,
    ) as MarketSortOption | PurchasedSortOption,
  );
  const [selectedOwnership, setSelectedOwnership] =
    useState<PurchasedOwnershipOption>(
      resolveOption(
        searchParams.get("ownership") ?? "all",
        PURCHASED_OWNERSHIP_OPTIONS,
        "all",
      ) as PurchasedOwnershipOption,
    );

  const handleMarketPriceSelect = (nextFilter: MarketPriceFilter) =>
    setSelectedPriceFilter((prev) => (prev === nextFilter ? null : nextFilter));

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
    if (variant === "market") {
      const { priceMin, priceMax } = resolveMarketPriceRange(selectedPriceFilter);

      if (priceMin != null) {
        params.set("priceMin", priceMin);
      }
      if (priceMax != null) {
        params.set("priceMax", priceMax);
      }
    }
    if (selectedSort !== config.defaults.sort) {
      params.set("sort", selectedSort);
    }
    if (variant === "purchased" && selectedOwnership !== "all") {
      params.set("ownership", selectedOwnership);
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

          {variant === "purchased" ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("filters.ownershipLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {PURCHASED_OWNERSHIP_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      option.value === selectedOwnership ? "secondary" : "outline"
                    }
                    size="sm"
                    aria-pressed={option.value === selectedOwnership}
                    onClick={() => setSelectedOwnership(option.value)}
                  >
                    {t(`filters.purchasedOwnershipOptions.${option.key}`)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

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

          {variant === "market" ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("filters.priceLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {MARKET_PRICE_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant={
                      filter.value === selectedPriceFilter
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                    className="rounded-full"
                    aria-pressed={filter.value === selectedPriceFilter}
                    onClick={() => handleMarketPriceSelect(filter.value)}
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
