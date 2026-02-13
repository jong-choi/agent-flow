import { Suspense } from "react";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { PagerButton } from "@/components/pager-button";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { buildQueryString } from "@/features/chats/utils/query-string";
import { CreditHistoryFilter } from "@/features/credits/components/history/history-filter";
import { TransactionItem } from "@/features/credits/components/transaction-item";
import {
  type TransactionResult,
  getCreditHistory,
} from "@/features/credits/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const PAGE_SIZE = 30;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/credits/history">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return {
    title: t("meta.historyTitle"),
  };
}

export default async function CreditsHistoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return (
    <PageContainer
      RightPanel={
        <Suspense>
          <CreditHistoryFilter />
        </Suspense>
      }
    >
      <PageStack>
        <PageHeader>
          <PageHeading>{t("history.heading")}</PageHeading>
          <PageDescription>{t("history.description")}</PageDescription>
        </PageHeader>
        <Suspense fallback={<CreditHistoryFallback />}>
          <CreditHistory params={params} searchParams={searchParams} />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

export async function CreditHistory({
  params,
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });
  const awaitedSearchParams = await searchParams;
  const type = Array.isArray(awaitedSearchParams?.type)
    ? awaitedSearchParams.type[0]
    : awaitedSearchParams?.type;
  const from = Array.isArray(awaitedSearchParams?.from)
    ? awaitedSearchParams.from[0]
    : awaitedSearchParams?.from;
  const to = Array.isArray(awaitedSearchParams?.to)
    ? awaitedSearchParams.to[0]
    : awaitedSearchParams?.to;
  const rawCursor = Array.isArray(awaitedSearchParams?.cursor)
    ? awaitedSearchParams.cursor[0]
    : awaitedSearchParams?.cursor;
  const cursor = rawCursor?.trim() || undefined;
  const rawDir = Array.isArray(awaitedSearchParams?.dir)
    ? awaitedSearchParams?.dir[0]
    : awaitedSearchParams?.dir;
  const dir = rawDir === "prev" ? "prev" : "next";
  const selectedType = type === "earn" || type === "spend" ? type : "all";

  const { transactions, range, pageInfo, totalCount, totalAmount } =
    await getCreditHistory(
      {
        from,
        to,
        type: selectedType,
      },
      { cursor, dir, limit: PAGE_SIZE },
    );

  const rangeLabel = `${format(range.from, "yy.MM.dd")} ~ ${format(
    range.to,
    "yy.MM.dd",
  )}`;

  const typeOptions = [
    { label: t("history.typeAll"), value: "all" },
    { label: t("history.typeEarn"), value: "earn" },
    { label: t("history.typeSpend"), value: "spend" },
  ] as const;

  const typeLabel =
    typeOptions.find((option) => option.value === selectedType)?.label ??
    t("history.typeAll");
  const baseParams = {
    type: selectedType,
    from: from ?? "",
    to: to ?? "",
  };
  const paginationDefaults = { type: "all" };
  const prevHref =
    pageInfo.hasPrev && pageInfo.prevCursor
      ? `/credits/history${buildQueryString(
          baseParams,
          { cursor: pageInfo.prevCursor, dir: "prev" },
          paginationDefaults,
        )}`
      : "";
  const nextHref =
    pageInfo.hasNext && pageInfo.nextCursor
      ? `/credits/history${buildQueryString(
          baseParams,
          { cursor: pageInfo.nextCursor, dir: "next" },
          paginationDefaults,
        )}`
      : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {t("history.badges.type", { value: typeLabel })}
        </Badge>
        <Badge variant="outline">
          {t("history.badges.period", { value: rangeLabel })}
        </Badge>
        <Badge variant="secondary">
          {t("history.badges.totalCount", {
            count: totalCount.toLocaleString(),
          })}
        </Badge>
        <Badge variant="secondary">
          {t("history.badges.totalAmount", {
            amount: totalAmount.toLocaleString(),
          })}
        </Badge>
      </div>
      <List
        transactions={transactions}
        locale={locale}
        hasPager={pageInfo.hasPrev || pageInfo.hasNext}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </div>
  );
}

async function List({
  transactions,
  locale,
  hasPager,
  prevHref,
  nextHref,
}: {
  transactions: TransactionResult[];
  locale: string;
  hasPager: boolean;
  prevHref: string;
  nextHref: string;
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return (
    <Card>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <ScrollArea className="min-h-0 flex-1">
          <div className="pb-3">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {t("history.empty")}
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    typeLabels={{
                      earn: t("transaction.earn"),
                      spend: t("transaction.spend"),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        {hasPager ? (
          <div className="shrink-0 border-t border-border/60 pt-4">
            <div className="flex items-center justify-center gap-2">
              <PagerButton
                direction="prev"
                href={prevHref || undefined}
                disabled={!prevHref}
              />
              <PagerButton
                direction="next"
                href={nextHref || undefined}
                disabled={!nextHref}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CreditHistoryFallback() {
  return (
    <Card className="border-border/60">
      <CardContent>
        <div className="space-y-6 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
